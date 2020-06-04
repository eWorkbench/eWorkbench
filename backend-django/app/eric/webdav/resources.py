#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os
import re
import shutil

from django.utils.http import urlquote
from django.utils.translation import gettext_lazy as _

from hashlib import md5, sha256
from mimetypes import guess_type

from django.core.cache import cache
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.files.uploadedfile import UploadedFile, SimpleUploadedFile
from django.db import transaction
from django.http import Http404, HttpResponseBadRequest
from django.utils.decorators import method_decorator
from django.utils.encoding import force_bytes
from django.views.decorators.csrf import csrf_exempt
from django_userforeignkey.request import get_current_request
from djangodav.base.resources import MetaEtagMixIn
from djangodav.db.resources import NameLookupDBDavMixIn, BaseDBDavResource
from djangodav.views import DavView
from djangodav.responses import ResponseException
from djangodav.auth.rest import RestAuthViewMixIn

from rest_framework.authentication import SessionAuthentication, BasicAuthentication, get_authorization_header

from eric.drives.models import Directory, Drive
from eric.projects.models import Project
from eric.shared_elements.models import File


User = get_user_model()


class CachedBasicAuthentication(BasicAuthentication):
    """
    Basic Authentication works by always submitting the same Authentication String:

    GET /secure/endpoint HTTP/1.1
    Host: localhost
    Authorization: Basic aHR0cHdhdGNoOmY=

    Djangos built-in ``BasicAuthentication`` will query the authentication backend everytime such a request is received
    Imagine this would query an LDAP Server or an SSO all the time -> this is quite expensive and slow

    To avoid this, we need cache the content of the ``Authorization`` header. However, this string basically contains
    the plaintext username/password (as Base64). Caching this value would be dangerous... Imagine that the caching
    server (e.g., redis) somehow exposes this information (misconfiguration, etc...). To counteract this, the
    authorization string is scrambled.

    Scrambling the authentication string uses Djangos built in ``make_password`` function. This is usually a very
    strong password derivation function, and we don't need to worry about this function at all (if this function
    ever becomes insecure, we will have a much bigger issue...). In addition, we are using a combination of the
    applications secret key
    """
    CACHED_BASIC_AUTHENTICATION_CACHE_KEY = "basic_auth_cache"

    @staticmethod
    def check_if_key_is_in_cache(key):
        return cache.get("{}:{}".format(
            CachedBasicAuthentication.CACHED_BASIC_AUTHENTICATION_CACHE_KEY, key
        ), None) is not None

    @staticmethod
    def add_key_to_cache(key):
        """
        Adds the key to the cache for 600 seconds
        :param key:
        :return:
        """
        cache.set("{}:{}".format(
            CachedBasicAuthentication.CACHED_BASIC_AUTHENTICATION_CACHE_KEY, key
        ), "", 600)

    @staticmethod
    def scramble_auth_string(auth_str, userid):
        """
        Scrambles the authentication string using djangos built-in make password function
        This is required in order to prevent storing of the actual authentication string (Base64 username+password) in
        memory
        :param auth_str:
        :param userid:
        :return:
        """
        # create a reproducable salt by hashing the secret key and the userid (secret key is used as a salt for the
        # hash here)
        user_id_hash = sha256(force_bytes(settings.SECRET_KEY) + userid.encode()).hexdigest()[0:8]

        # using djangos make_password function (uses PBKDF or similar ), hash the authentication string
        # (we dont want to store the raw Base64 password/username in memory...)
        return make_password(auth_str, salt=user_id_hash)

    def authenticate_credentials(self, userid, password, request=None):
        """
        BasicAuthentications authenticate method
        This usually receives a userid and a password, and looks those details up in the database
        Additionally, we scramble the authentication string and look the generated key up in our cache
        :param userid:
        :param password:
        :param request:
        :return:
        """
        key = self.scramble_auth_string(
            get_authorization_header(request).split()[0],
            userid
        )

        # check if the user has recently authed with this key
        if self.check_if_key_is_in_cache(key):
            # found the key in cache -> get user by userid
            user = User.objects.get(username=userid)

            return (user, None)

        # else: handle auth
        user, resp = super(CachedBasicAuthentication, self).authenticate_credentials(userid, password, request)

        if user:
            # auth successful, add this key to cache
            self.add_key_to_cache(key)

        return user, resp


class AuthFsDavView(RestAuthViewMixIn, DavView):
    """
    Special View providing Authentication for our Webdav Resource
    """
    authentications = (CachedBasicAuthentication(), SessionAuthentication())

    @method_decorator(csrf_exempt)
    @transaction.atomic
    def dispatch(self, request, *args, **kwargs):
        drive = kwargs.get('drive', None)
        if 'path' not in kwargs:
            kwargs['path'] = ""

        if drive:
            drive = Drive.objects.filter(pk=drive).first()

            # check that the drive exists
            if not drive:
                raise Http404

            # ToDo: We need to do a permission check here, but request.user is not set here, as it gets set
            # ToDo: in the dispatch method of the super class
            # ToDo: However, collection_model_qs() should not return any directories, if they are not viewable

            request.drive = drive

            del kwargs['drive']

        project = kwargs.get('project', None)

        if project:
            project = Project.objects.filter(pk=project).first()

            if not project:
                raise Http404

            request.project = project

            del kwargs['project']

        if 'drive_title' in kwargs:
            del kwargs['drive_title']

        if 'project_title' in kwargs:
            del kwargs['project_title']

        # continue
        return super(AuthFsDavView, self).dispatch(request, *args, **kwargs)


class MyProjectListResource(MetaEtagMixIn, BaseDBDavResource):
    collection_model = Project

    created_attribute = 'created_at'
    modified_attribute = 'last_modified_at'

    def getcontentlength(self):
        return 0

    def obj(self):
        return None

    def get_children(self):
        """Return an iterator of all direct children of this resource."""
        for child in Project.objects.viewable().not_deleted():
            # strip all non-confirming characters from drive title
            pat = re.compile(r'[\W \-]+')

            stripped_title = re.sub(pat, ' ', child.name)

            yield self.clone(
                "/" + stripped_title + " (" + str(child.pk) + ")",
                obj=child    # Sending ready object to reduce db requests
            )

    def get_escaped_path(self):
        path = [urlquote(p) for p in self.path]
        return "/".join(path) + ("/" * self.is_collection)

    @property
    def is_collection(self):
        return True

    @property
    def is_object(self):
        return False


class MyDriveListResource(MetaEtagMixIn, BaseDBDavResource):
    """
    Lists all drives that the current user has access to
    """
    name_attribute = 'title'
    size_attribute = 'size'
    created_attribute = 'created_at'
    modified_attribute = 'last_modified_at'
    collection_attribute = None

    base_url = ""

    def obj(self):
        return None

    def get_children(self):
        """Return an iterator of all direct children of this resource."""
        # get all drives
        drives = Drive.objects.viewable().not_deleted()

        request = get_current_request()

        # if this request is project specific, filter projects
        if hasattr(request, 'project'):
            drives = drives.filter(projects=request.project)

        for child in drives:
            # strip all non-confirming characters from drive title
            pat = re.compile(r'[\W \-]+')

            stripped_title = re.sub(pat, ' ', child.title)

            yield self.clone(
                "/" + stripped_title + " (" + str(child.pk) + ")",
                obj=child    # Sending ready object to reduce db requests
            )

    def get_escaped_path(self):
        path = [urlquote(p) for p in self.path]
        return "/".join(path) + ("/" * self.is_collection)

    @property
    def is_collection(self):
        return True

    @property
    def is_object(self):
        return False


class MyDriveDavResource(MetaEtagMixIn, NameLookupDBDavMixIn, BaseDBDavResource):
    """
    WebDav Resource for a specific drive
    Lists all directories within a drive
    """

    object_model = File
    collection_model = Directory

    name_attribute = 'name'
    size_attribute = 'file_size'
    created_attribute = 'created_at'
    modified_attribute = 'last_modified_at'
    collection_attribute = 'directory'

    root = settings.MEDIA_ROOT

    def __init__(self, path, **kwargs):
        if path == "/":
            request = get_current_request()
            obj = Directory.objects.filter(drive=request.drive, is_virtual_root=True).first()
            kwargs["obj"] = obj

        super(MyDriveDavResource, self).__init__(path, **kwargs)

    def get_model_by_path(self, model_attr, path):
        path = ["/"] + path

        return super(MyDriveDavResource, self).get_model_by_path(model_attr, path)

    @property
    def collection_model_qs(self):
        request = get_current_request()

        return Directory.objects.viewable().filter(drive=request.drive)

    @property
    def object_model_qs(self):
        request = get_current_request()

        return File.objects.viewable().filter(directory__drive=request.drive).not_deleted()

    def read(self):
        # read the path of the file
        return self.obj.path

    def get_parent_path(self):
        parent_path = super(MyDriveDavResource, self).get_parent_path()

        if not parent_path.startswith("/"):
            parent_path = "/" + parent_path

        return parent_path

    def get_parent(self):
        return self.clone(self.get_parent_path())

    def write(self, content, range_start=None, temp_file=None):
        """
        Write - creates a new file or updates an existing one
        :param request:
        :param temp_file:
        :return:
        """
        request = content

        if not self.exists:
            # create a new object within the drive
            self.obj = self.object_model()

        # check if temp_file is set by nginx
        if temp_file:
            # file has already been created by nginx, process it
            # determine size of temp_file
            size = os.stat(temp_file).st_size

            # move file
            new_file_path = File.generate_file_name(temp_file)

            shutil.move(temp_file, new_file_path)

            some_file = UploadedFile(
                file=open(new_file_path, 'rb'),
                name=self.displayname,
                size=size,
                content_type=guess_type(self.displayname)[0] or "application/octet-stream"
            )
        else:
            # file is being submitted in body/memory
            some_file = SimpleUploadedFile(
                name=self.displayname,
                content=request.body,
                content_type=guess_type(self.displayname)[0] or "application/octet-stream"
            )

        parent = self.get_parent().obj

        # do not allow users to store files without a parent directory (e.g., in the drive root)
        if not parent:
            raise ResponseException(HttpResponseBadRequest(_("Please use a sub directory")))

        # set name
        setattr(self.obj, self.name_attribute, self.displayname)
        # set parent directory
        setattr(self.obj, self.collection_attribute, parent)

        self.obj.path = some_file

        # when a new file is created, wait for it to have a proper name before the upload
        if self.displayname.startswith('~ew') and self.displayname.endswith('.tmp'):
            raise ResponseException(HttpResponseBadRequest(_("Not uploading until the file is named")))

        self.obj.save()

    # override this method to make sure we are creating the collection within a drive
    def create_collection_in_db(self, parent, name):
        """
        Create a collection within the database
        :param parent: the parent object
        :param name: the name of the new collection
        :return:
        """
        request = get_current_request()

        if not parent:
            # if parent is not set, set it to the virtual root
            parent = Directory.objects.filter(drive=request.drive, is_virtual_root=True).first()

        self.collection_model.objects.create(
            drive=request.drive, **{self.collection_attribute: parent, 'name': name}
        )

    def delete(self):
        """
        Soft delete an object
        :return:
        """
        if not self.obj:
            return

        if self.is_object:
            # objects need to be trashed
            self.obj.trash()
        else:
            # directories can not be trashed, they are deleted
            self.obj.delete()

    def copy_object(self, destination):
        """
        Copy a file object

        This copies a file object by actually copying the physical file
        :param destination:
        :return:
        """
        # fake the upload file by using the existing file
        copied_file = UploadedFile(
            file=self.obj.path.file,
            name=self.obj.original_filename,
            size=getattr(self.obj, self.size_attribute),
            content_type=guess_type(self.displayname)[0] or "application/octet-stream"
        )

        new_obj = self.object_model()

        new_obj.path = copied_file

        name = destination.path[-1]
        collection = self.clone(destination.get_parent_path()).obj

        setattr(new_obj, self.name_attribute, name)
        setattr(new_obj, self.collection_attribute, collection)
        setattr(new_obj, self.size_attribute, getattr(self.obj, self.size_attribute))

        self.obj = new_obj

        self.obj.save(force_insert=True)
