#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from operator import and_
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q
from django.utils.functional import cached_property
from django.utils.timezone import now
from eric.webdav.wsgidav_base_resources import BaseDavResource
from eric.webdav.wsgidav_utils import url_join
from functools import reduce


class BaseDBDavResource(BaseDavResource):
    collection_model = None
    object_model = None

    collection_attribute = 'parent'
    created_attribute = 'created'
    modified_attribute = 'modified'
    name_attribute = 'name'
    size_attribute = 'size'

    def __init__(self, path, **kwargs):
        if 'obj' in kwargs:  # Accepting ready object to reduce db requests
            self.__dict__['obj'] = kwargs.pop('obj')
        super(BaseDBDavResource, self).__init__(path)

    @cached_property
    def obj(self):
        raise NotImplementedError

    @property
    def getcontentlength(self):
        return getattr(self.obj, self.size_attribute)

    def get_created(self):
        if self.is_root:
            return now()
        return getattr(self.obj, self.created_attribute)

    def get_modified(self):
        if self.is_root:
            return now()
        return getattr(self.obj, self.modified_attribute)

    @property
    def is_collection(self):
        return self.is_root or isinstance(self.obj, self.collection_model)

    @property
    def is_object(self):
        return isinstance(self.obj, self.object_model)

    @cached_property
    def exists(self):
        return self.is_root or bool(self.obj)

    def get_model_lookup_kwargs(self, **kwargs):
        return self.get_model_kwargs(**kwargs)

    def get_model_kwargs(self, **kwargs):
        return kwargs

    def get_children(self):
        """Return an iterator of all direct children of this resource."""
        if not self.exists or isinstance(self.obj, self.object_model):
            return

        querysets = [
            self.collection_model_qs,
            self.object_model_qs
        ]
        for qs in querysets:
            # get kwargs for this model
            kwargs = self.get_model_lookup_kwargs(**{self.collection_attribute: self.obj})

            # wtf?
            for child in qs.filter(**kwargs):
                yield self.clone(
                    url_join(*(self.path + [child.name])),
                    obj=child    # Sending ready object to reduce db requests
                )

    def read(self):
        raise NotImplementedError

    # ToDo: here it is called `content`, but in our example it is called `request` ... why?
    def write(self, content, temp_file=None, range_start=None):
        raise NotImplementedError

    def delete(self):
        if not self.obj:
            return
        self.obj.delete()


class NameLookupDBDavMixIn(object):
    """Object lookup by joining collections tables to fit given path"""

    def __init__(self, path, **kwargs):
        self.possible_collection = path.endswith("/")
        super(NameLookupDBDavMixIn, self).__init__(path, **kwargs)

    def get_object(self):
        return self.get_model_by_path('object', self.path)

    def get_collection(self):
        return self.get_model_by_path('collection', self.path)

    def create_collection_in_db(self, parent, name):
        """
        Create a collection within the database
        :param parent: the parent object
        :param name: the name of the new collection
        :return:
        """
        self.collection_model.objects.create(
            **{self.collection_attribute: parent, 'name': name}
        )

    def create_collection(self):
        """
        Create a new collection within the collection_model
        :return:
        """
        # get name of the new collection
        name = self.path[-1]
        # get the parent object (ToDo: Why is this cloned?)
        parent = self.clone("/".join(self.path[:-1])).obj

        self.create_collection_in_db(parent, name)

    @cached_property
    def obj(self):
        if not self.path:
            return None

        if self.possible_collection:  # Reducing queries
            attempts = [self.get_collection, self.get_object]
        else:
            attempts = [self.get_object, self.get_collection]

        for get_object in attempts:
            try:
                return get_object()
            except ObjectDoesNotExist:
                continue

    def get_model_by_path(self, model_attr, path):
        if not path:
            return None

        args = []
        i = 0
        for part in reversed(path):
            args.append(Q(**{"__".join(([self.collection_attribute] * i) + [self.name_attribute]): part}))
            i += 1
        qs = getattr(self, "%s_model_qs" % model_attr).filter(**self.get_model_lookup_kwargs())

        args.append(Q(**{"__".join([self.collection_attribute] * len(path)): None}))
        try:
            return qs.filter(reduce(and_, args))[0]
        except IndexError:
            raise qs.model.DoesNotExist()

    def copy_object(self, destination):
        """
        Copy an object to a destination

        Collections (directories) are just copied within the database.
        Files are copied by duplicating the file within the storage, and also inserting a new element into our database
        :param destination:
        :return:
        """
        print("in my copy object method")

        # ToDo: When we "copy" a file (not a collection), we should also physically copy the file

        self.obj.pk = None
        name = destination.path[-1]
        collection = self.clone(destination.get_parent_path()).obj
        setattr(self.obj, self.name_attribute, name)
        setattr(self.obj, self.collection_attribute, collection)
        setattr(self.obj, self.created_attribute, now())
        setattr(self.obj, self.modified_attribute, now())

        self.obj.save(force_insert=True)

    def move_object(self, destination):
        """
        Move an object to a destination

        This basically just changes the name and the collection (directory) of an element
        :param destination:
        :return:
        """
        name = destination.path[-1]
        collection = self.clone(destination.get_parent_path()).obj
        setattr(self.obj, self.name_attribute, name)
        setattr(self.obj, self.collection_attribute, collection)
        setattr(self.obj, self.modified_attribute, now())
        self.obj.save(update_fields=[self.name_attribute, self.collection_attribute, self.modified_attribute])
