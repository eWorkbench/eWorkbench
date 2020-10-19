#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" Contains the project models for eRIC """
import logging
import os
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from django.core.files.uploadhandler import MemoryFileUploadHandler
from django.db import models
from django.db.models import Case, Value, When
from django.db.models.functions import Concat
from django.utils import timezone
from django.utils.deconstruct import deconstructible
from django.utils.translation import gettext_lazy as _
from django_changeset.models import RevisionModelMixin
from django_cleanhtmlfield.fields import HTMLField
from django_request_cache import cache_for_request
from django_userforeignkey.request import get_current_user

from eric.core.admin.is_deleteable import IsDeleteableMixin
from eric.core.models import BaseModel, LockMixin
from eric.core.models.abstract import SoftDeleteMixin, ChangeSetMixIn, WorkbenchEntityMixin
from eric.metadata.models.fields import MetadataRelation
from eric.model_privileges.models.abstract import ModelPrivilegeMixIn
from eric.projects.models.cache import ALL_PROJECTS_CACHE_KEY, get_cache_key_for_sub_projects
from eric.projects.models.exceptions import UserStorageLimitReachedException, MaxFileSizeReachedException
from eric.projects.models.managers import ProjectManager, ResourceManager, ProjectRoleUserAssignmentManager, \
    UserStorageLimitManager, RoleManager, ElementLockManager
from eric.relations.models import RelationsMixIn
from eric.search.models import FTSMixin
from eric.site_preferences.models import options

logger = logging.getLogger(__name__)

User = get_user_model()


def validate_file_is_pdf(value):
    """
    Validates that an uploaded file has the .pdf extension
    :param value:
    :return:
    """
    # get extension
    ext = os.path.splitext(value.name)[1]
    if ext.lower() != ".pdf":
        raise ValidationError({"terms_of_use_pdf": _("File extension must be .pdf")})


@deconstructible
class UploadToPathAndRename(object):
    """ Automatically rename the uploaded file to a random UUID.{extension} """

    def __init__(self, path):
        self.sub_path = path

    def __call__(self, instance, filename):
        # get filename extension
        ext = filename.split('.')[-1]
        # set filename as random string
        filename = '{}.{}'.format(uuid.uuid4().hex, ext)
        # return the whole path to the file
        return os.path.join(self.sub_path, filename)


def scramble_uploaded_filename(filename):
    """ scramble/uglify the filename of the uploaded file, keep the file extension """
    if "." in filename:
        extension = filename.split(".")[-1]
        return "{}.{}".format(uuid.uuid4(), extension)
    else:
        return str(uuid.uuid4())


class MyUser(User):
    """
    Creates a user proxy model such that we can sort the user by userprofile and provide a custom str method
    """

    class Meta:
        proxy = True
        ordering = (
            'userprofile__last_name',
            'userprofile__first_name',
            'email',
            'username',
        )

    def __str__(self):
        """
        Returns the userprofile first name and last name
        If not available, just return the users email or the username
        """

        try:
            # it is possible that there is no userprofile available for the current user
            profile = self.userprofile
            first_name = profile.first_name
            last_name = profile.last_name

            if first_name != '' and last_name != '':
                return f'{first_name} {last_name}'
        except:
            # ignore (userprofile not available)
            pass

        return self.email if self.email != '' else self.username

    def anonymize_user_data(self):
        self.username = 'anonymous-user-{}'.format(self.pk)
        self.first_name = 'Anonymous'
        self.last_name = 'User'
        self.email = None
        self.password = ''
        self.last_login = timezone.now()
        self.date_joined = timezone.now()
        self.is_superuser = False
        self.is_staff = False
        self.is_active = False

        self.save()

    def anonymize_userprofile_data(self):
        old_userprofile_avatar_path = self.userprofile.avatar.path

        self.userprofile.first_name = 'Anonymous'
        self.userprofile.last_name = 'User'
        self.userprofile.anonymized = True
        self.userprofile.academic_title = ''
        self.userprofile.avatar = 'unknown_user.gif'
        self.userprofile.avatar_height = 142
        self.userprofile.avatar_width = 144
        self.userprofile.country = ''
        self.userprofile.email_others = None
        self.userprofile.org_zug_mitarbeiter = None
        self.userprofile.org_zug_mitarbeiter_lang = None
        self.userprofile.org_zug_student = None
        self.userprofile.org_zug_student_lang = None
        self.userprofile.phone = ''
        self.userprofile.salutation = ''
        self.userprofile.title_post = ''
        self.userprofile.title_pre = ''
        self.userprofile.title_salutation = ''
        self.userprofile.type = self.userprofile.NORMAL_USER
        self.userprofile.additional_information = ''
        self.userprofile.website = None
        self.userprofile.jwt_verification_token = self.random_jwt_token()
        self.userprofile.ui_settings = None

        self.userprofile.save()

        if type(old_userprofile_avatar_path) == str and 'unknown_user.gif' not in old_userprofile_avatar_path:
            os.remove(os.path.join(settings.MEDIA_ROOT, old_userprofile_avatar_path))

    @staticmethod
    def random_jwt_token():
        import random
        import string
        return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(128))


class ElementLock(BaseModel):
    """
    A Model for locking Elements
    """
    objects = ElementLockManager()

    class Meta:
        verbose_name = _("Element Lock")
        verbose_name_plural = _("Element Locks")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    locked_at = models.DateTimeField(
        auto_now=True
    )

    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("Who locked this element"),
        related_name="locked_elements",
        on_delete=models.CASCADE
    )

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name=_('Content type of the assigned entity'),
    )

    object_id = models.UUIDField(
        verbose_name=_('Object id of the assigned entity'),
    )

    content_object = GenericForeignKey(
        'content_type',
        'object_id'
    )

    @property
    def locked_until(self):
        return self.locked_at + timezone.timedelta(minutes=options.element_lock_time_in_minutes)

    def __str__(self):
        return _("User %(username)s locked entity %(entity_name)s") % {
            'username': self.locked_by.username,
            'entity_name': str(self.content_object)
        }


class Project(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, SoftDeleteMixin, RelationsMixIn,
              WorkbenchEntityMixin):
    """ Defines a project with a name, description, state, several dates, etc... """
    objects = ProjectManager()

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = _("Project")
        verbose_name_plural = _("Projects")
        ordering = ["name", "start_date", "project_state", ]
        permissions = (
            ("trash_project", "Can trash a project"),
            ("restore_project", "Can restore a project"),
            ("invite_external_user", "Can invite external users"),
            ("change_parent_project", "Can change the parent project property")
        )
        # track all fields
        track_fields = ('name', 'description', 'project_state', 'start_date', 'stop_date', 'parent_project', 'deleted')
        track_soft_delete_by = "deleted"
        fts_template = 'fts/project.html'
        is_relatable = True  # Can be linked to other elements
        can_have_special_permissions = False  # No model privileges for projects

        def get_default_serializer(*args, **kwargs):
            from eric.projects.rest.serializers import ProjectSerializerExtended
            return ProjectSerializerExtended

    # Project State Choices
    INITIALIZED = 'INIT'
    STARTED = 'START'
    FINISHED = 'FIN'
    PAUSED = 'PAUSE'
    CANCEL = 'CANCE'
    DELETED = 'DEL'
    PROJECT_STATE_CHOICES = (
        (INITIALIZED, 'Initialized'),
        (STARTED, 'Started'),
        (PAUSED, 'Paused'),
        (FINISHED, 'Finished'),
        (CANCEL, 'Cancelled'),
        (DELETED, 'Deleted')
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(
        max_length=128,
        verbose_name=_("Name of the Project"),
        blank=False,
        db_index=True
    )
    description = HTMLField(
        verbose_name=_("Description of the Project"),
        blank=True,
        strip_unsafe=True,
    )
    project_state = models.CharField(
        max_length=5,
        choices=PROJECT_STATE_CHOICES,
        verbose_name=_("State of the Project"),
        default=INITIALIZED,
        db_index=True
    )
    start_date = models.DateTimeField(
        verbose_name=_("Project start date"),
        blank=True,
        null=True,
        db_index=True
    )
    stop_date = models.DateTimeField(
        verbose_name=_("Project stop date"),
        blank=True,
        null=True,
        db_index=True
    )
    parent_project = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Parent Project"),
        related_name='sub_projects'
    )

    def get_project_where_user_has_role(self, user):
        """
        Returns the (parent) project where the given user has any permission
        :param user:
        :return:
        """
        permissions = Permission.objects.filter(
            role__assigned_users_projects__user=user,
            role__assigned_users_projects__project=self
        )

        if permissions.count() != 0:
            return permissions
        elif self.parent_project:
            return self.parent_project.get_project_where_user_has_role(user)
        else:
            return None

    def get_current_users_project_permissions(self):
        """
        Get the current users permission for the project (self)
        Also collects permissions for the parent project chain

        ToDo: The following query is probably very database heavy and should be cached within the server application
        ToDo: (e.g., in redis) per user and project - however, we need to reset this every time there is a change on
        ToDo: on the project permissions

        :return: a QuerySet of permissions assigned to the user for the selected projects
        :rtype: django.db.models.QuerySet
        """
        user = get_current_user()

        # check if this is an anonymous user --> no permissions
        if user.is_anonymous:
            return Permission.objects.none()
        elif user.is_superuser:
            return Permission.objects.all()

        pk_list = self.parent_pk_list

        # get permissions from all parent projects (via get_breadcrumb_queryset)
        return Permission.objects.filter(
            role__assigned_users_projects__user=user,
            role__assigned_users_projects__project__in=pk_list
        )

    @property
    def current_users_project_permissions_list(self):
        """
        Returns a flat list of permissions in the form of app_label.permission_list for the current project
        :return:
        """
        return self.get_current_users_project_permissions().annotate(
            permission_full_name=Concat('content_type__app_label', Value('.'), 'codename')
        ).values_list('permission_full_name', flat=True).distinct()

    def get_assigned_user_up(self):
        """
        Traverses the project tree UP and returns a list of all assigned users
        :return:
        """
        assigned_users = self.assigned_users_roles.values_list('user__pk', flat=True).distinct()

        if self.parent_project:
            parent_assigned_users = self.parent_project.get_assigned_user_up().distinct()
            assigned_users = assigned_users | parent_assigned_users

        return assigned_users

    def get_assigned_user_up_full(self):
        """
        Traverses the project tree UP and returns a list of all assigned users
        :return:
        """
        assigned_users = self.assigned_users_roles.all()

        if self.parent_project:
            parent_assigned_users = self.parent_project.get_assigned_user_up_full()
            assigned_users = assigned_users | parent_assigned_users

        return assigned_users

    def duplicate(self, *args, **kwargs):
        """
        Duplicates the Project and removes all non-relevant variables (such as Django ChangeSet __original_data__)
        """
        project_dict = self.__dict__
        # delete id for creating a new object
        del project_dict['id']
        # duplicated project should not be soft deleted even if the original project is
        del project_dict['deleted']
        # variables are generated automatically
        del project_dict['version_number']
        del project_dict['fts_index']
        del project_dict['fts_language']
        del project_dict['_state']
        del project_dict['__original_data__']

        # updates the project dict (e.g. name or parent pk should be changed in the duplicated object)
        project_dict.update(kwargs)

        # create a new project object and save it
        new_project_object = Project(**project_dict)
        new_project_object.save()

        return new_project_object

    @property
    def child_tree(self):
        """
        Returns all viewable parent-projects and the current project.
        Used by ProjectSerializerExtended.
        """
        return self

    @property
    def project_tree(self):
        """
        Returns all sub projects and the current project.
        Used by ProjectSerializerExtended.
        """

        # Hint: A user with access to a project always also has access to all sub-projects

        # add current project to list of sub-projects
        projects = [self] + self.all_sub_projects

        # sometimes a weird behaviour occurs, where a project is contained two times (probably some caching issue)
        # => make sure all projects are distinct
        return list(set(projects))

    @property
    def all_sub_projects(self):
        """ Gets all sub projects (recursively) of the project """

        return self.get_all_sub_projects_for(self.pk)

    def __str__(self):
        return self.name

    @property
    @cache_for_request
    def parent_pk_list(self):
        """
        Collects a list of parent primary keys (only if the parent project is also viewable)
        :param include_self: Include self in the pk_list
        :return:
        """
        # get all viewable projects
        viewable_projects = Project.get_all_viewable_projects()
        viewable_project_pks = {}

        # build an index with viewable projects
        # viewable_project_pks = dict(Project.objects.viewable().values_list('pk', 'parent_project_id'))
        for project in viewable_projects:
            viewable_project_pks[project.pk] = project.parent_project_id

        # traverse the path up
        pk_list = [self.pk]
        pk_parent = self.pk

        while pk_parent:
            # break if pk_parent is not in viewable project_pks
            if pk_parent not in viewable_project_pks:
                break

            pk_parent = viewable_project_pks[pk_parent] if viewable_project_pks[pk_parent] else None

            if pk_parent:
                pk_list.append(pk_parent)

        return pk_list

    def get_breadcrumb_queryset(self, include_self=False):
        """
        Gets a queryset for the parent structure of the project, which keeps the the order. The first element
        in the queryset is the project the method is called on (if include_self=True) or the parent of the project
        the method is called on (if include_self=False), the second is its parent, and so on ...
        :param include_self: Include self in the breadcrumbs result
        :return:
        """
        pk_list = self.parent_pk_list

        # build a case/when structure on which the query can be sorted on. this will result in an SQL
        # as follows:
        # SELECT ... FROM ...
        # ORDER BY
        #   CASE
        #     WHEN ID=... THEN 0
        #     WHEN ID=... THEN 1
        #     WHEN ID=... THEN 2
        preserved_order = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(pk_list)])

        return Project.objects.viewable().filter(pk__in=pk_list).order_by(preserved_order)

    def validate_circular_references(self):
        """
        Validates that the parent_project can be set to the new value and that this does not cause circular references
        within the
        :return:
        """
        cur_project = self
        while cur_project.parent_project:
            if cur_project.parent_project.pk == self.pk:
                raise ValidationError({
                    'parent_project': ValidationError(
                        _('Invalid parent project %(parent_project)s - Circular reference detected'),
                        params={'parent_project': self.parent_project},
                        code='invalid'
                    )
                })
            cur_project = cur_project.parent_project

    def validate_start_end_date(self):
        """
        Validates that the project `start_time` is before or equal `stop_date`
        :return:
        """
        start_date = self.start_date
        stop_date = self.stop_date

        if stop_date is not None and start_date is not None and stop_date < start_date:
            raise ValidationError({
                'start_date': ValidationError(
                    _('Start date must be before stop date'),
                    code='invalid'
                ),
                'stop_date': ValidationError(
                    _('Stop date must be after start date'),
                    code='invalid'
                ),
            })

    def clean(self):
        """ validate that the current user is allowed to change the parent_project
        and validate that parent_project has no circular references  """

        # self.validate_is_allowed_to_change_parent_project()
        self.validate_circular_references()
        self.validate_start_end_date()

    @staticmethod
    @cache_for_request
    def get_all_viewable_projects():
        """
        Static cached method that retrieves a list of all viewable projects
        :return:
        """
        return list(Project.objects.viewable())

    @staticmethod
    def get_all_projects():
        """
        Returns a cached list of all_projects.
        If the cache is empty, the list is filled from database.
        :return:
        """
        all_projects = cache.get(ALL_PROJECTS_CACHE_KEY, None)

        if all_projects is None:
            all_projects = list(Project.objects.all())
            cache.set(ALL_PROJECTS_CACHE_KEY, all_projects, timeout=None)

        return all_projects

    @classmethod
    def get_all_sub_projects_for_list(cls, pk_list):
        """ Gets all the sub projects (recursively) for all the given project PKs """

        all_sub_projects = []

        for pk in pk_list:
            all_sub_projects.extend(cls.get_all_sub_projects_for(pk))

        return all_sub_projects

    @classmethod
    def get_all_sub_project_pks_for_list(cls, pk_list):
        """ Gets all the sub project PKs (recursively) for all the given project PKs """

        return [project.pk for project in cls.get_all_sub_projects_for_list(pk_list)]

    @staticmethod
    def get_all_sub_projects_for(pk):
        """ Gets all sub projects (recursively) for the given project PK """

        # load sub projects from cache
        cache_key = get_cache_key_for_sub_projects(pk)
        sub_projects = cache.get(cache_key, None)

        # update cache if it is empty
        if sub_projects is None:
            # find the PKs of all sub projects
            sub_pk_list = Project.load_all_sub_projects_of([pk])

            # load project data and cache it
            sub_projects = list(Project.objects.filter(pk__in=sub_pk_list))
            cache_key = get_cache_key_for_sub_projects(pk)
            cache.set(cache_key, sub_projects, timeout=None)

        return sub_projects

    @classmethod
    def get_all_sub_project_pks_for(cls, pk):
        """ Gets all sub project PKs (recursively) for the given project PK """

        return [project.pk for project in cls.get_all_sub_projects_for(pk)]

    @staticmethod
    def load_all_sub_projects_of(pk_list):
        """
        Builds a list of all sub projects (recursively) for the given project PKs.
        :param pk_list: list of project PKs
        :return: list of sub project PKs
        """
        all_projects = Project.get_all_projects()
        sub_project_pks = []

        # get all projects where the parent project id can be found in pk_list
        for project in all_projects:
            if project.parent_project_id in pk_list:
                sub_project_pks.append(project.pk)

        # if there are any projects, get their sub projects
        if len(sub_project_pks) > 0:
            try:
                r = Project.load_all_sub_projects_of(sub_project_pks)
                sub_project_pks.extend(r)
            except RuntimeError as re:
                # catch runtime errors (maximum recursion depth exceeded)
                logger.error(
                    _('Runtime error in get_all_sub_projects() - possible circular reference: {}').format(re.args[0])
                )

        return sub_project_pks

    @staticmethod
    def duplicate_sub_projects(parent_pk_dict):
        """
        Duplicates the whole project tree based on a list of parent primary keys.
        When the method is called from project viewset, the list has only one entry which is the top of the project
        tree. When it is called from inside this method, the list has as many entries as sub projects exists.

        For each parent project the primary keys of the underlying sub projects are fetched
        For each sub project the parent project id is set to the pk of the duplicated parent project and the sub
        projects are duplicated as well.
        :param parent_pk_dict: dictionary of the original primary keys of the parent project and the new ones
        """
        if len(parent_pk_dict.keys()) > 0:
            # store original and new pks of the sub projects in order to find other sub projects
            dict_pk = {}

            original_parent_pk_list = parent_pk_dict.keys()
            for original_parent_pk in original_parent_pk_list:
                # get all sub_projects objects based on the parent_project. The original parent pk is used because the
                # parent_project_id references to the original pk of the parent project
                sub_projects = Project.objects.viewable().filter(parent_project__id=original_parent_pk)
                # duplicate the sub project and set parent pk to the pk of the new parent project
                for sub_project in sub_projects:
                    sub_project_original_pk = sub_project.pk

                    # duplicate the sub project
                    # change the parent project pk to the pk of the new parent (Because it was duplicated as well)
                    duplicated_sub_project = sub_project.duplicate(parent_project_id=parent_pk_dict[original_parent_pk])

                    dict_pk[sub_project_original_pk] = duplicated_sub_project.pk

                    # duplicate all tasks of the original sub_project and assign them to the new duplicated sub_project
                    from eric.shared_elements.models import Task
                    tasks = Task.objects.viewable().filter(projects__in=[sub_project_original_pk])
                    if tasks:
                        for task in tasks:
                            duplicated_task = task.duplicate(projects=[duplicated_sub_project])

            # duplicate sub projects of the sub projects
            Project.duplicate_sub_projects(dict_pk)


class Role(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """ A role is a set of permissions that applies to a project and a user (via 3-way assignment) """
    objects = RoleManager()

    class Meta:
        track_fields = ('name',)
        track_through = ('permissions',)
        ordering = ['-default_role_on_project_create', 'name']

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(
        max_length=255,
        verbose_name=_("Name of the role")
    )

    permissions = models.ManyToManyField(
        'auth.Permission',
        through='RolePermissionAssignment',
        blank=True,
        verbose_name="roles"
    )

    default_role_on_project_create = models.BooleanField(
        verbose_name=_("Marks the default role when creating a new project (should be exactly one role)"),
        default=False
    )

    default_role_on_project_user_assign = models.BooleanField(
        verbose_name=_("Marks the default role when a new user is assigned to project (should be exactly one role)"),
        default=False
    )

    def __str__(self):
        return _("Role %(role_name)s") % {'role_name': self.name}


class RolePermissionAssignment(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """ Assignment (through) table for role and permission """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    role = models.ForeignKey(
        'Role',
        verbose_name=_("The assigned permission is for this role"),
        on_delete=models.CASCADE
    )

    permission = models.ForeignKey(
        'auth.Permission',
        verbose_name=_("The permission which is assigned to this role"),
        on_delete=models.CASCADE
    )

    def __str__(self):
        return _("Role %(role_name)s is assigned to permission %(permission)s") % {
            'role_name': self.role, 'permission': self.permission
        }


class ProjectRoleUserAssignment(BaseModel, ChangeSetMixIn, RevisionModelMixin, IsDeleteableMixin):
    """ 3-way assignment between Project, Role and User """
    objects = ProjectRoleUserAssignmentManager()

    class Meta:
        unique_together = (
            ('user', 'project'),
            ('user', 'project', 'role')
        )
        # default ordering by username and project
        ordering = ['user__username', 'project']
        track_fields = ('user', 'project', 'role',)

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.ForeignKey(
        "projects.MyUser",
        related_name='assigned_projects_roles',
        verbose_name=_("Which user is assigned to this project and role"),
        on_delete=models.CASCADE
    )

    project = models.ForeignKey(
        'Project',
        related_name='assigned_users_roles',
        verbose_name=_("Which project is assigned to this user and role"),
        on_delete=models.CASCADE
    )

    role = models.ForeignKey(
        'Role',
        related_name='assigned_users_projects',
        verbose_name=_("Which role is assigned to this user and project"),
        on_delete=models.CASCADE
    )

    def __str__(self):
        return _("%(username)s is assigned to project %(project_name)s with role %(role_name)s") % {
            'username': str(self.user), 'project_name': self.project.name, 'role_name': self.role.name
        }

    def is_deleteable(self):
        """
        Verifies whether this Project Role User Assignment is deleteable
        This allows us to make sure that a project ALWAYS has a project manager
        UNLESS the project should be deleted (project_state == Project.DELETED)
        :return:
        """
        # always allow deleting non project manager roles
        if not self.role.default_role_on_project_create:
            return True

        # also allow deleting this object if the project state is set to deleted (or the project is soft deleted)
        if self.project.project_state == Project.DELETED or self.project.deleted:
            return True

        # get all current project managers
        assignments = ProjectRoleUserAssignment.objects.filter(
            project=self.project,
            role__in=Role.objects.filter(default_role_on_project_create=True)
        )

        # if there is only one left, raise a validation error
        if assignments.count() == 1:
            return False
        # else:
        return True


class UserStorageLimit(BaseModel, ChangeSetMixIn, RevisionModelMixin):
    """
    Each users receives a certain amount of storage (in megabyte)
    """

    objects = UserStorageLimitManager()

    class Meta:
        verbose_name = _("User Storage Limit")
        verbose_name_plural = _("User Storage Limits")
        # track all fields
        track_fields = ('storage_megabyte', 'comment', 'user',)

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.OneToOneField(
        "projects.MyUser",
        on_delete=models.CASCADE,
        related_name='user_storage_limit',
        verbose_name=_("Which user is this storage limit for")
    )

    storage_megabyte = models.IntegerField(
        verbose_name=_("Maximum available storage in megabyte")
    )

    comment = models.TextField(
        verbose_name=_("Comment about the storage limit"),
        blank=True
    )

    def __str__(self):
        return _("The %(user)s has a maximum storage limit of %(storage_megabyte)s MB") % {
            'user': str(self.user), 'storage_megabyte': self.storage_megabyte
        }

    @staticmethod
    def calculate_used_storage(user):
        """
        Calculates the used storage of the user (in megabyte)

        This counts all files and pictures of the user
        :param user: MyUser
        :return: float megabytes of used storage
        """
        from eric.shared_elements.models import UploadedFileEntry
        from eric.pictures.models import UploadedPictureEntry
        from eric.kanban_boards.models import KanbanBoard

        used_storage = 0

        # get all uploaded file entries which are created by the user
        # (contains also the active file which is saved in File)
        uploaded_file_entries = UploadedFileEntry.objects.filter(created_by=user)

        # calculates the used storage of the uploaded file entries
        for uploaded_file_entry in uploaded_file_entries:
            used_storage = used_storage + uploaded_file_entry.file_size

        # get all pictures which are created by the user
        pictures = UploadedPictureEntry.objects.filter(created_by=user)

        # calculates the used storage of the pictures
        for picture in pictures:
            if picture.background_image:
                used_storage += picture.background_image_size

            if picture.rendered_image:
                used_storage += picture.rendered_image_size

            if picture.shapes_image:
                used_storage += picture.shapes_image_size

        # get all kanban boards which are created by the user
        kanban_boards = KanbanBoard.objects.filter(created_by=user)

        # calculate the used storage of the background images of KanbanBoard
        for kanban_board in kanban_boards:
            if kanban_board.background_image:
                used_storage += kanban_board.background_image_size

        return used_storage / (1024 * 1024)  # convert bytes into MegaBytes


class FileSystemStorageLimitByUser(FileSystemStorage):
    """
    Django FileSystemStorage that prevents the user from using more file storage than their quota allows.
    When the limit is reached, a UserStorageLimitReachedException is raised

    In combination with FileSystemStorageLimitByUserUploadHandler this should prevent users from uploading files once
    their quota is reached.

    Example::

        some_file = models.FileField(
            storage=FileSystemStorageLimitByUser()
        )

    """

    def _save(self, name, content):
        """
        Save method, called when a file is "saved in this storage".
        In this method we determine whether the content size of the file that is being saved still fits within the
        users quota
        :param name:
        :param content:
        :return:
        """
        user = get_current_user()

        # get current used storage
        current_used_storage = UserStorageLimit.calculate_used_storage(user)
        # get the maximum allowed storage
        maximum_allowed_storage = user.user_storage_limit.storage_megabyte

        # calculate how many storage will be used when the new file will be uploaded
        total_used_storage = current_used_storage + (content.size / (1024 * 1024))

        # checks if the used storage will be greater than the allowed storage
        if total_used_storage >= maximum_allowed_storage:
            # inform the user that the file can not be uploaded because the limit of the user storage is reached and
            # how much storage is available
            raise UserStorageLimitReachedException(maximum_allowed_storage - current_used_storage)

        # user has enough space - save file
        return super(FileSystemStorageLimitByUser, self)._save(name, content)


class FileSystemStorageLimitByUserUploadHandler(MemoryFileUploadHandler):
    """
    File Upload handler that checks whether the uploaded file can be stored based on the users storage limit

    This Upload Handler prevents users from abusing server resources by uploading large files. For instance, if the
    user uploads a 10 GB file, although the user only has a 100 MB quota, that 10 GB file can be rejected straight
    away.
    The default behaviour of MemoryFileUploadHandler aswell as TemporaryFileUploadHandler (both used by default in
    ``settings.FILE_UPLOAD_HANDLERS``) would result in a file created in Djangos Temp Folder (usually /tmp). This file
    would be removed, once the upload has completed (or failed). But the question is: Why store the file initially,
    when we already know that the user is not allowed to upload any more files?

    To achieve this, we extended the existing MemoryFileUploadHandler, which manages POST/FILE requests in memory,
    if the content_length is less than ``settings.FILE_UPLOAD_MAX_MEMORY_SIZE``.

    In handle_raw_input() we then determine whether the user has enough storage to finish the upload or not.

    If the user storage limit is hit with this request, an UserStorageLimitReachedException is stored in self.exception,
    and it is raised in upload_complete(). In addition, None is returned in receive_data_chunk(), which tells the
    calling method ``MultiPartParser.parse`` that data should not be processed any further (e.g., saved to File or
    to a MemoryStream).
    """

    def __init__(self, *args, **kwargs):
        super(FileSystemStorageLimitByUserUploadHandler, self).__init__(*args, **kwargs)
        self.exception = None

    def handle_raw_input(self, input_data, META, content_length, boundary, encoding=None):
        """
        Warning: As with any data from the client, you should not trust
        content_length (and sometimes won't even get it).

        Though there is no harm in checking if, in case the client did set it properly :)
        :param input_data:
        :param META:
        :param content_length:
        :param boundary:
        :param encoding:
        :return:
        """
        # file size must be lower than options.max_upload_size_in_megabyte
        if content_length / 1024 / 1024 / 1024 > options.max_upload_size_in_megabyte:
            self.exception = MaxFileSizeReachedException(
                options.max_upload_size_in_megabyte
            )
            # make sure the super class ``MemoryFileUploadHandler`` is not active
            self.activated = False
        else:
            # get current users storage limit
            user = get_current_user()

            if not user.is_anonymous:
                # get current storage limit and how much is used right now
                maximum_allowed_storage = user.user_storage_limit.storage_megabyte
                current_used_storage = UserStorageLimit.calculate_used_storage(user)

                # check if the user storage limit is hit with the new content length
                if current_used_storage + content_length / 1024 / 1024 > maximum_allowed_storage:
                    # it is hit, create an exception and store it in self.exception
                    self.exception = UserStorageLimitReachedException(
                        maximum_allowed_storage - current_used_storage
                    )
                    # make sure the super class ``MemoryFileUploadHandler`` is not active
                    self.activated = False

        # else: let the super class ``MemoryFileUploadHandler`` handle this
        super(FileSystemStorageLimitByUserUploadHandler, self).handle_raw_input(
            input_data, META, content_length, boundary, encoding
        )

    def receive_data_chunk(self, raw_data, start):
        """
        On receive data chunk, decide what to do with the chunk
        If we got an exception, we discard the chunk. Else we let the super class ``MemoryFileUploadHandler``
        process the chunk
        :param raw_data:
        :param start:
        :return:
        """
        if self.exception:
            # return None, signaling that this chunk has been consumed, therefore preventing that this chunk is
            # consumed by any other handler (temp file handler)
            return None

        # else: let the super class ``MemoryFileUploadHandler`` handle this
        return super(FileSystemStorageLimitByUserUploadHandler, self).receive_data_chunk(raw_data, start)

    def file_complete(self, file_size):
        """
        On file complete, we should return a file
        However, when we got an exception (storage limit exceeded), we do not have a file, and we just return None
        :param file_size:
        :return:
        """
        if self.exception:
            # return None, we do not have a file to process
            return None

        # else: let the super class ``MemoryFileUploadHandler`` handle this
        return super(FileSystemStorageLimitByUserUploadHandler, self).file_complete(file_size)

    def upload_complete(self):
        """
        Last but not least, upload complete is called. When we got an exception, we need to raise it. Else we just
        let the super class handle it.
        :return:
        """
        if self.exception:
            raise self.exception

        # else: let the super class ``MemoryFileUploadHandler`` handle this
        return super(FileSystemStorageLimitByUserUploadHandler, self).upload_complete()


class Resource(BaseModel, ChangeSetMixIn, RevisionModelMixin, FTSMixin, LockMixin, SoftDeleteMixin, RelationsMixIn,
               ModelPrivilegeMixIn, WorkbenchEntityMixin):
    """ A resource for meetings (Room, device, ...) """
    objects = ResourceManager()

    # define resource types
    ROOM = "ROOM"
    LAB_EQUIPMENT = "LABEQ"
    OFFICE_EQUIPMENT = "OFFEQ"
    IT_RESOURCE = "ITRES"
    # define resource type choices
    TYPE_CHOICES = (
        (ROOM, "Room"),
        (LAB_EQUIPMENT, "Lab Equipment"),
        (OFFICE_EQUIPMENT, "Office Equipment"),
        (IT_RESOURCE, "IT-Resource"),
    )

    # define user availability types
    GLOBAL = "GLB"
    PROJECT = "PRJ"
    SELECTED_USERS = "USR"
    # define user availability choices
    USER_AVAILABILITY_CHOICES = (
        (GLOBAL, "Global"),
        (PROJECT, "Only project members"),
        (SELECTED_USERS, "Only selected users"),
    )

    # define branch library
    CHEMISTRY = "CHEM"
    MATH_IT = "MAIT"
    MEDICINE = "MEDIC"
    PHYSICS = "PHY"
    SPORT_HEALTH_SCIENCES = "SHSCI"
    MAIN_CAMPUS = "MCAMP"
    WEIHENSTEPHAN = "WEIH"
    # define branch library choices
    BRANCH_LIBRARY_CHOICES = (
        (CHEMISTRY, "Chemistry"),
        (MATH_IT, "Mathematics & Informatics"),
        (MEDICINE, "Medicine"),
        (PHYSICS, "Physics"),
        (SPORT_HEALTH_SCIENCES, "Sport & Health Sciences"),
        (MAIN_CAMPUS, "Main Campus"),
        (WEIHENSTEPHAN, "Weihenstephan"),
    )

    class Meta(WorkbenchEntityMixin.Meta):
        verbose_name = _("Resource")
        verbose_name_plural = _("Resources")
        ordering = ["name", "type", "location", "description"]
        track_fields = (
            'name',
            'description',
            'type',
            'responsible_unit',
            'location',
            'contact',
            'terms_of_use_pdf',
            'projects',
            'user_availability',
            'user_availability_selected_users',
            'user_availability_selected_user_groups',
            'deleted',
        )
        permissions = (
            ("trash_resource", "Can trash a resource"),
            ("restore_resource", "Can restore a resource"),
            ("change_project_resource", "Can change the project of a resource"),
            ("add_resource_without_project", "Can add a resource without a project")
        )
        track_soft_delete_by = "deleted"
        fts_template = 'fts/resource.html'
        export_template = 'export/resource.html'

        def get_default_serializer(*args, **kwargs):
            from eric.projects.rest.serializers import ResourceSerializer
            return ResourceSerializer

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    name = models.CharField(
        max_length=256,
        verbose_name=_("Name of the resource"),
        db_index=True
    )

    description = HTMLField(
        verbose_name=_("Description of the resource"),
        blank=True,
        strip_unsafe=True,
    )

    type = models.CharField(
        max_length=5,
        choices=TYPE_CHOICES,
        default=ROOM,
        verbose_name=_("Type of this resource"),
        db_index=True
    )

    responsible_unit = models.CharField(
        max_length=256,
        default='',
        verbose_name=_("Responsible unit of the resource"),
        blank=True
    )

    location = models.TextField(
        verbose_name=_("Location of this resource"),
        default='',
        blank=True
    )

    contact = models.TextField(
        verbose_name=_("Contact of this resource"),
        default='',
        blank=True
    )

    terms_of_use_pdf = models.FileField(
        verbose_name=_("Terms of Use PDF file"),
        max_length=512,
        blank=True,
        null=True,
        storage=FileSystemStorageLimitByUser()
    )

    # reference to many projects (can be 0 projects, too)
    projects = models.ManyToManyField(
        'projects.Project',
        verbose_name=_("Which projects is this resource associated to"),
        related_name="resources",
        blank=True
    )

    user_availability = models.CharField(
        max_length=3,
        choices=USER_AVAILABILITY_CHOICES,
        default=GLOBAL,
        verbose_name=_("User availability for this resource"),
        blank=False,
        db_index=True
    )

    # reference to many user groups (can be 0 user groups, too)
    user_availability_selected_user_groups = models.ManyToManyField(
        Group,
        verbose_name=_("The selected user groups this resource is available for"),
        related_name="resources",
        blank=True,
    )

    user_availability_selected_users = models.ManyToManyField(
        get_user_model(),
        verbose_name=_("The selected users this resource is available for"),
        related_name="resources",
        blank=True,
    )

    study_room = models.BooleanField(
        verbose_name=_("Study Room"),
        default=False,
        db_index=True
    )

    branch_library = models.CharField(
        verbose_name=_("Branch Library of Study Room"),
        max_length=5,
        choices=BRANCH_LIBRARY_CHOICES,
        blank=True,
        db_index=True
    )

    metadata = MetadataRelation()

    def __str__(self):
        return _("Resource {}").format(self.name)

    def clean(self):
        """
        Extra model field validations
        """
        if self.study_room and not self.branch_library:
            raise ValidationError({
                'branch_library': ValidationError(
                    _('You have to choose a branch library if study room is selected'),
                    code='invalid'
                )
            })

        if self.branch_library and not self.study_room:
            raise ValidationError({
                'branch_library': ValidationError(
                    _('You have to choose a study room if a branch library is selected'),
                    code='invalid'
                )
            })

        super(Resource, self).clean()

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        """
        Rename the uploaded file, make sure it is stored in the proper directory
        :param force_insert:
        :param force_update:
        :param using:
        :param update_fields:
        :return:
        """
        # check if terms_of_use_pdf file has changed
        if self.terms_of_use_pdf and hasattr(self.terms_of_use_pdf.file, 'content_type'):
            # validate that the file is a pdf
            validate_file_is_pdf(self.terms_of_use_pdf)
            # rename terms_of_use_pdf
            new_terms_of_use_pdf_file_name = scramble_uploaded_filename(self.terms_of_use_pdf.name)

            new_terms_of_use_pdf_file_path = settings.WORKBENCH_SETTINGS['project_file_upload_folder'] % {
                'filename': new_terms_of_use_pdf_file_name
            }

            # create folder if it does not exist
            if not os.path.exists(os.path.dirname(new_terms_of_use_pdf_file_path)):
                os.makedirs(os.path.dirname(new_terms_of_use_pdf_file_path))

            # make sure the path we use is relative to the MEDIA_ROOT, we dont want to store the whole path
            new_terms_of_use_pdf_file_path = os.path.relpath(new_terms_of_use_pdf_file_path, settings.MEDIA_ROOT)

            self.terms_of_use_pdf.name = new_terms_of_use_pdf_file_path

        # call super method
        super(Resource, self).save(
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields
        )


class ResourceBookingRuleMinimumDuration(models.Model):
    """ Booking rule for minimum duration """

    class Meta:
        verbose_name = _("Resource booking rule minimum duration")
        verbose_name_plural = _("Resource booking rules minimum duration")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    duration = models.DurationField(
        verbose_name=_("The minimum duration of a resource booking")
    )

    resource = models.OneToOneField(
        'projects.Resource',
        on_delete=models.CASCADE,
        verbose_name=_("Booked resource"),
        related_name="booking_rule_minimum_duration",
    )


class ResourceBookingRuleMaximumDuration(models.Model):
    """ Booking rule for maximum duration """

    class Meta:
        verbose_name = _("Resource booking rule maximum duration")
        verbose_name_plural = _("Resource booking rules maximum duration")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    duration = models.DurationField(
        verbose_name=_("The maximum duration of a resource booking")
    )

    resource = models.OneToOneField(
        'projects.Resource',
        on_delete=models.CASCADE,
        verbose_name=_("Booked resource"),
        related_name="booking_rule_maximum_duration",
    )


class ResourceBookingRuleBookableHours(models.Model):
    """ Booking rule for bookable hours """

    class Meta:
        verbose_name = _("Resource booking rule bookable hours")
        verbose_name_plural = _("Resource booking rules bookable hours")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    monday = models.BooleanField(
        verbose_name=_("Monday"),
        default=False,
    )

    tuesday = models.BooleanField(
        verbose_name=_("Tuesday"),
        default=False,
    )

    wednesday = models.BooleanField(
        verbose_name=_("Wednesday"),
        default=False,
    )

    thursday = models.BooleanField(
        verbose_name=_("Thursday"),
        default=False,
    )

    friday = models.BooleanField(
        verbose_name=_("Friday"),
        default=False,
    )

    saturday = models.BooleanField(
        verbose_name=_("Saturday"),
        default=False,
    )

    sunday = models.BooleanField(
        verbose_name=_("Sunday"),
        default=False,
    )

    time_start = models.TimeField(
        verbose_name=_("Time start")
    )

    time_end = models.TimeField(
        verbose_name=_("Time end")
    )

    resource = models.OneToOneField(
        'projects.Resource',
        on_delete=models.CASCADE,
        verbose_name=_("Booked resource"),
        related_name="booking_rule_bookable_hours",
    )


class ResourceBookingRuleMinimumTimeBefore(models.Model):
    """ Booking rule for minimum time before """

    class Meta:
        verbose_name = _("Resource booking rule minimum time before")
        verbose_name_plural = _("Resource booking rules minimum time before")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    duration = models.DurationField(
        verbose_name=_("The minimum time before a resource booking")
    )

    resource = models.OneToOneField(
        'projects.Resource',
        on_delete=models.CASCADE,
        verbose_name=_("Booked resource"),
        related_name="booking_rule_minimum_time_before",
    )


class ResourceBookingRuleMaximumTimeBefore(models.Model):
    """ Booking rule for maximum time before """

    class Meta:
        verbose_name = _("Resource booking rule maximum time before")
        verbose_name_plural = _("Resource booking rules maximum time before")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    duration = models.DurationField(
        verbose_name=_("The maximum time before a resource booking")
    )

    resource = models.OneToOneField(
        'projects.Resource',
        on_delete=models.CASCADE,
        verbose_name=_("Booked resource"),
        related_name="booking_rule_maximum_time_before",
    )


class ResourceBookingRuleTimeBetween(models.Model):
    """ Booking rule for time between """

    class Meta:
        verbose_name = _("Resource booking rule time between")
        verbose_name_plural = _("Resource booking rules time between")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    duration = models.DurationField(
        verbose_name=_("The minimum time between a resource booking")
    )

    resource = models.OneToOneField(
        'projects.Resource',
        on_delete=models.CASCADE,
        verbose_name=_("Booked resource"),
        related_name="booking_rule_time_between",
    )


class ResourceBookingRuleBookingsPerUser(models.Model):
    """ Booking rule for bookings per user """
    # define choices for the units
    UNIT_CHOICES = (
        ('DAY', "Day"),
        ('WEEK', "Week"),
        ('MONTH', "Month"),
    )

    class Meta:
        verbose_name = _("Resource booking rule bookings per user")
        verbose_name_plural = _("Resource booking rules bookings per user")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    count = models.IntegerField(
        verbose_name=_("The number of times a user can book a resource")
    )

    unit = models.CharField(
        max_length=5,
        choices=UNIT_CHOICES,
        default='DAY',
    )

    resource = models.ForeignKey(
        'projects.Resource',
        verbose_name=_("Booking rules for bookings_per_user"),
        related_name="booking_rule_bookings_per_user",
        blank=True,
        on_delete=models.CASCADE,
    )

    def validate_booking_rule_overlap(self):
        """
        Validates that the booking rule doesn't overlap with already existing ones for this resource
        exclude if pk is the same to allow patching (editing)
        filter only if the resource is the same
        then look for entries with the same units
        if entries exist raise ValidationError on the unit
        :return:
        """
        if ResourceBookingRuleBookingsPerUser.objects \
                .exclude(pk=self.pk) \
                .filter(resource=self.resource) \
                .filter(unit=self.unit) \
                .exists():
            raise ValidationError({
                'unit': ValidationError(
                    _('A rule with this unit already exists for this Resource'),
                    code='invalid'
                ),
            })

    def clean(self):
        """ run the validations  """
        self.validate_booking_rule_overlap()
