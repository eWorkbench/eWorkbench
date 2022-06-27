#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.db.models import Q
from django.utils import timezone
from django_changeset.models.queryset import ChangeSetQuerySetMixin
from django_request_cache import cache_for_request
from django_userforeignkey.request import get_current_user

from eric.core.models import BaseQuerySet
from eric.core.models.base import SoftDeleteQuerySetMixin
from eric.core.models.utils import get_permission_name_without_app_label
from eric.site_preferences.models import options as site_preferences

logger = logging.getLogger(__name__)


def extend_queryset(queryset_class=None, **kwargs):
    """
    Extend a QuerySets decorator filter method with custom ``django.db.models.Q``

    :param queryset_class: The QuerySet Class that needs to be extended
    :type queryset_class: BaseProjectEntityPermissionQuerySet
    :return:
    """

    def _extend_queryset_wrapper(cls):
        # make sure queryset is set
        if not queryset_class:
            raise ValueError("A QuerySet class needs to be passed to this decorator")

        # make sure it has extended_queryset_filters
        if not hasattr(queryset_class, "extended_queryset_filters"):
            raise ValueError("QuerySet needs to have extended_viewable_filters")

        queryset_class.add_extended_queryset_filter(cls)

        return cls

    return _extend_queryset_wrapper


class BaseProjectPermissionQuerySet(BaseQuerySet, SoftDeleteQuerySetMixin):
    """
    Base QuerySet for elements that are directly associated to a single project, such as:
    - ProjectRoleUserAssignment
    """

    @staticmethod
    @cache_for_request
    def get_all_project_ids_with_permission(entity, permission, cache_id=None):
        """
        Generic method that gets all projects (and respective sub projects) where the current user has a role
        with permission 'permission'
        :param entity: the entity to use for the lookup
        :type entity: eric.core.models.base.BaseModel
        :param permission: the permission to look up (e.g., view_project)
        :type permission: basestring
        :param cache_id: a unique id to make sure the request is not cached by @cache_for_request, not used in the
                        function per se
        :type cache_id: basestring
        :return: a list of project primary keys
        :rtype: list
        """
        from eric.projects.models import Project, ProjectRoleUserAssignment

        user = get_current_user()

        if not user.pk:  # handle anonymous user
            return list()

        # if the user has the global permission "view_project", they can view all projects anyway
        if user.has_perm('projects.{}'.format(permission)):
            # return codeword "all"
            return list(["all"], )
        else:
            # access ProjectRoleUserAssignment and get all projects where user has the permission
            projects_ids = ProjectRoleUserAssignment.objects.filter(
                user=user,
                role__permissions__content_type=entity.get_content_type(),
                role__permissions__codename=permission
            ).distinct().values_list('project__id', flat=True)

            pk_list_with_subprojects = Project.get_all_projects_with_descendants(projects_ids)

            return pk_list_with_subprojects

    def for_project(self, project_pk, *args, **kwargs):
        """
        Adds a filter for project pk, which also loads all sub projects
        """
        from eric.projects.models import Project

        pk_list = kwargs.pop('prefetched_project_ids', None)

        if not pk_list:
            pk_list = Project.objects.filter(pk=project_pk).first().get_descendants(include_self=True)

        return self.filter(
            projects__pk__in=pk_list
        ).distinct()

    def viewable(self, *args, **kwargs):
        """
        Returns all elements associated to the project where the user has the view permission of the current model
        """
        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, get_permission_name_without_app_label(self.model, 'view')
        )

        if "all" in project_pks:
            return self.all().distinct()

        return self.filter(
            Q(
                # get all entities where the current user has permissions
                project__pk__in=project_pks
            )
        ).distinct()

    def editable(self, *args, **kwargs):
        """
        Returns all elements associated to the project where the user has the change permission of the current model
        """
        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, get_permission_name_without_app_label(self.model, 'change')
        )

        if "all" in project_pks:
            return self.all().distinct()

        return self.filter(
            project__pk__in=project_pks
        ).distinct()

    def related_project_attribute_editable(self, *args, **kwargs):
        """
        Returns an `all` QuerySet if current user has the 'APP.MODEL_change_project' permission (whereas "APP"
        corresponds to the managed models app label and "MODEL" corresponds to the managed models name).
        Returns a `none` QuerySet else.
        """
        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, get_permission_name_without_app_label(self.model, 'change_project')
        )

        if "all" in project_pks:
            return self.all().distinct()

        return self.filter(
            project__pk__in=project_pks
        ).distinct()

    def deletable(self, *args, **kwargs):
        """
        Returns all elements associated to the project where the user has the delete permission of the current model
        """
        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, get_permission_name_without_app_label(self.model, 'delete')
        )

        if "all" in project_pks:
            return self.filter(deleted=True).distinct()

        return self.filter(
            project__pk__in=project_pks
        ).distinct()


class ProjectRoleUserAssignmentQuerySet(BaseProjectPermissionQuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for Project Role User Assignment
    """

    def for_project(self, project_pk, *args, **kwargs):
        """
        Adds a filter for project pk and all sub projects
        """
        from eric.projects.models import Project

        pk_list = kwargs.pop('prefetched_project_ids', None)

        if not pk_list:
            pk_list = Project.objects.filter(pk=project_pk).first().get_descendants(include_self=True)

        return self.filter(
            project__pk__in=pk_list
        )


class BaseProjectEntityPermissionQuerySetMetaClass(type):
    """
    Meta Class that initializes an extended_queryset_filters array for the respective class
    """

    def __init__(cls, name, bases, d):
        type.__init__(cls, name, bases, d)
        cls.extended_queryset_filters = []


class BaseProjectEntityPermissionQuerySet(
    BaseProjectPermissionQuerySet,
    metaclass=BaseProjectEntityPermissionQuerySetMetaClass
):
    """
    An extended queryset which covers the ModelPrivileges for each entity, in addition to the project roles

    metaclass is set to BaseProjectEntityPermissionQuerySetMetaClass, providing extended_queryset_filters as a
    class object for the actual class that inherits from BaseProjectEntityPermissionQuerySet
    """

    @classmethod
    def add_extended_queryset_filter(cls, filterset_class):
        """
        Adds a filter class to the extended queryset filters
        :param filterset_class:
        :return:
        """
        cls.extended_queryset_filters.append(filterset_class)

    def _get_extended_viewable_filters(self):
        """
        Returns a joined Q list of filter conditions for the .viewable() filter
        :return: joined list of viewable filter conditions
        :rtype: django.db.models.Q
        """
        conds = Q()

        # get all filter classes that provide a viewable method, and join it with the existing filter conditions
        for filterset_class in type(self).extended_queryset_filters:
            if hasattr(filterset_class, '_viewable') and callable(filterset_class._viewable):
                conds |= filterset_class._viewable()

        return conds

    def _get_extended_editable_filters(self):
        """
        Returns a joined Q list of filter conditions for the .editable() filter
        :return: a joined list of editable filter conditions
        :rtype: django.db.models.Q
        """
        conds = Q()

        # get all filter classes that provide a editable method, and join it with the existing filter conditions
        for filterset_class in type(self).extended_queryset_filters:
            if hasattr(filterset_class, '_editable') and callable(filterset_class._editable):
                conds |= filterset_class._editable()

        return conds

    def _get_extended_trashable_filters(self):
        """
        Returns a joined Q list of filter conditions for the .trashable() filter
        :return: a joined list of deletable filter conditions
        :rtype: django.db.models.Q
        """
        conds = Q()

        # get all filter classes that provide a trashable method, and join it with the existing filter conditions
        for filter_class in type(self).extended_queryset_filters:
            if hasattr(filter_class, '_trashable') and callable(filter_class._trashable):
                conds |= filter_class._trashable()

        return conds

    def _get_extended_restoreable_filters(self):
        """
        Returns a joined Q list of filter conditions for the .restoreable() filter
        :return: a joined list of restoreable filter conditions
        :rtype: django.db.models.Q
        """
        conds = Q()

        # get all filter classes that provide a deletable method, and join it with the existing filter conditions
        for filter_class in type(self).extended_queryset_filters:
            if hasattr(filter_class, '_restoreable') and callable(filter_class._restoreable):
                conds |= filter_class._restoreable()

        return conds

    def _get_extended_deletable_filters(self):
        """
        Returns a joined Q list of filter conditions for the .deletable() filter
        :return: a joined list of deletable filter conditions
        :rtype: django.db.models.Q
        """
        conds = Q()

        # get all filter classes that provide a deletable method, and join it with the existing filter conditions
        for filterset_class in type(self).extended_queryset_filters:
            if hasattr(filterset_class, '_deletable') and callable(filterset_class._deletable):
                conds |= filterset_class._deletable()

        return conds

    def related_viewable(self, *args, **kwargs):
        """
        Viewable if it is related
        by default, this equals to the viewable method.
        However, not all notes that are related are viewable, so
        :class:`~eric.shared_elements.models.querysets.NoteQuerySet` will override this method
        """
        return self.viewable(*args, **kwargs)

    def prefetch_common(self, *args, **kwargs):
        """
        Prefetches common elements, such as the changeset
        Other QuerySets might override this method and prefetch more then that, e.g.:

        - :class:`~eric.shared_elements.models.querysets.MeetingQuerySet` might prefetch ``resource``
        - :class:`~eric.shared_elements.models.querysets.TaskQuerySet` might prefetch ``assignees``
        """
        return self.prefetch_related('created_by', 'created_by__userprofile',
                                     'last_modified_by', 'last_modified_by__userprofile')

    def prefetch_metadata(self, *args, **kwargs):
        """
        Prefetches metadata.
        """
        return self.prefetch_related('metadata').prefetch_related('metadata__field')

    def viewable(self, *args, **kwargs):
        """
        Returns all elements of the model where
        - the element is associated to a project and the user has the view_model permission on the project (project_pks)
        - the element has the model privilege 'view' or 'full_access' for the current user
        - the element does not have a model privilege 'deny_view' for the current user (deny_object_ids)
        """
        user = get_current_user()
        if user.is_anonymous:
            return self.none()
        elif user.is_superuser:
            return self.all()

        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, get_permission_name_without_app_label(self.model, 'view')
        )

        if "all" in project_pks:
            return self.all()

        from eric.model_privileges.models import ModelPrivilege

        # get all object ids where view_privilege is set to deny
        deny_object_ids = ModelPrivilege.objects.for_model(self.model).filter(
            user=user,
            view_privilege=ModelPrivilege.DENY
        ).values_list('object_id', flat=True)

        return self.filter(
            Q(
                # get all entities where the current user has permissions based on project
                projects__pk__in=project_pks
            ) | Q(
                # get all entities where the current user is the owner
                model_privileges__full_access_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | Q(
                # get all entities where the current user has read access
                model_privileges__view_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | self._get_extended_viewable_filters()
        ).exclude(
            # exclude all entities that are listed in deny object ids
            id__in=deny_object_ids
        ).distinct()

    def editable(self, *args, **kwargs):
        """
        Returns all elements of the model where

        - the element is associated to a project and the user has the change_model permission on the project
           (project_pks)
        - the element has the model privilege 'edit' or 'full_access' for the current user
        - the element does not have a model privilege 'deny_edit' for the current user (deny_object_ids)
        """
        user = get_current_user()

        if user.is_anonymous:
            return self.none()
        elif user.is_superuser:
            return self.all()

        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, get_permission_name_without_app_label(self.model, 'change')
        )

        if "all" in project_pks:
            return self.all()

        from eric.model_privileges.models import ModelPrivilege

        # get all object ids where edit_privilege is set to deny
        deny_object_ids = ModelPrivilege.objects.for_model(self.model).filter(
            user=user,
            edit_privilege=ModelPrivilege.DENY
        ).values_list('object_id', flat=True)

        return self.filter(
            Q(
                # get all entities where the current user has permissions based on project
                projects__pk__in=project_pks
            ) | Q(
                # get all entities where the current user is the owner
                model_privileges__full_access_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | Q(
                # get all entities where the current user has edit access
                model_privileges__edit_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | self._get_extended_editable_filters()
        ).exclude(
            # exclude all entities that are listed in deny object ids
            id__in=deny_object_ids
        ).distinct()

    def deletable(self, *args, **kwargs):
        """
        Returns all elements of the model where

        - the element is associated to a project and the user has the delete_model permission on the project
           (project_pks)
        - the element has the model privilege 'delete' or 'full_access' for the current user
        - the element does not have a model privilege 'deny_delete' for the current user (deny_object_ids)
        """
        user = get_current_user()

        if user.is_anonymous:
            return self.none()
        elif user.is_superuser:
            return self.all()

        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, get_permission_name_without_app_label(self.model, 'delete')
        )

        if "all" in project_pks:
            return self.filter(deleted=True)

        from eric.model_privileges.models import ModelPrivilege

        # get all object ids where edit_privilege is set to deny
        deny_object_ids = ModelPrivilege.objects.for_model(self.model).filter(
            user=user,
            delete_privilege=ModelPrivilege.DENY
        ).values_list('object_id', flat=True)

        return self.filter(
            Q(
                # get all entities where the current user has permissions
                projects__pk__in=project_pks
            ) | Q(
                # get all entities where the current user is the owner
                model_privileges__full_access_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | Q(
                # get all entities where the current user has read access
                model_privileges__delete_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | self._get_extended_deletable_filters()
        ).exclude(
            # exclude all entities that are listed in deny object ids
            id__in=deny_object_ids
        ).distinct()

    def restorable(self, *args, **kwargs):
        """
        Returns all elements of the model where

        - the element is associated to a project and the user has the restore_model permission on the project
           (project_pks)
        - the element has the model privilege 'restore' or 'full_access' for the current user
        - the element does not have a model privilege 'deny_restore' for the current user (deny_object_ids)
        """
        user = get_current_user()

        if user.is_anonymous:
            return self.none()
        elif user.is_superuser:
            return self.all()

        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, get_permission_name_without_app_label(self.model, 'restore')
        )

        if "all" in project_pks:
            return self.filter(deleted=True)

        from eric.model_privileges.models import ModelPrivilege

        # get all object ids where edit_privilege is set to deny
        deny_object_ids = ModelPrivilege.objects.for_model(self.model).filter(
            user=user,
            restore_privilege=ModelPrivilege.DENY
        ).values_list('object_id', flat=True)

        return self.filter(
            Q(
                # get all entities where the current user has permissions
                projects__pk__in=project_pks
            ) | Q(
                # get all entities where the current user is the owner
                model_privileges__full_access_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | Q(
                # get all entities where the current user has restore access
                model_privileges__restore_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | self._get_extended_restoreable_filters()
        ).exclude(
            # exclude all entities that are listed in deny object ids
            id__in=deny_object_ids
        ).filter(
            # only allow soft-deleted object
            deleted=True
        ).distinct()

    def trashable(self, *args, **kwargs):
        """
        Returns all elements of the model where

        - the element is associated to a project and the user has the trash_model permission on the project
           (project_pks)
        - the element has the model privilege 'trash' or 'full_access' for the current user
        - the element does not have a model privilege 'deny_trash' for the current user (deny_object_ids)
        """
        user = get_current_user()

        if user.is_anonymous:
            return self.none()
        elif user.is_superuser:
            return self.all()

        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, get_permission_name_without_app_label(self.model, 'trash')
        )

        if "all" in project_pks:
            return self.filter(deleted=False)

        from eric.model_privileges.models import ModelPrivilege

        # get all object ids where edit_privilege is set to deny
        deny_object_ids = ModelPrivilege.objects.for_model(self.model).filter(
            user=user,
            trash_privilege=ModelPrivilege.DENY
        ).values_list('object_id', flat=True)

        return self.filter(
            Q(
                # get all entities where the current user has permissions
                projects__pk__in=project_pks
            ) | Q(
                # get all entities where the current user is the owner
                model_privileges__full_access_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | Q(
                # get all entities where the current user has restore access
                model_privileges__trash_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | self._get_extended_trashable_filters()
        ).exclude(
            # exclude all entities that are listed in deny object ids
            id__in=deny_object_ids
        ).filter(
            # only allow soft-deleted object
            deleted=False
        ).distinct()

    def related_project_attribute_editable(self, *args, **kwargs):
        """
        Returns an `all` QuerySet if current user has the 'APP.MODEL_change_project' permission (whereas "APP"
        corresponds to the managed models app label and "MODEL" corresponds to the managed models name).
        Returns a `none` QuerySet else.
        """
        user = get_current_user()

        if user.is_anonymous:
            return self.none()
        elif user.is_superuser:
            return self.all()

        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, get_permission_name_without_app_label(self.model, 'change_project')
        )

        if "all" in project_pks:
            return self.all()

        from eric.model_privileges.models import ModelPrivilege

        # get all object ids where edit_privilege is set to deny
        deny_object_ids = ModelPrivilege.objects.for_model(self.model).filter(
            user=user,
            edit_privilege=ModelPrivilege.DENY
        ).values_list('object_id', flat=True)

        return self.filter(
            Q(
                # get all entities where the current user has permissions
                projects__pk__in=project_pks
            ) | Q(
                # get all entities where the current user is the owner
                model_privileges__full_access_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | Q(
                # get all entities where the current user has read access
                model_privileges__edit_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            )
        ).exclude(
            # exclude all entities that are listed in deny object ids
            id__in=deny_object_ids
        ).distinct()


class ProjectQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for Project model, where viewable returns only the projects created by the current user
    (or all, if is_staff)
    """

    def related_viewable(self, *args, **kwargs):
        return self.viewable(*args, **kwargs)

    def prefetch_common(self, *args, **kwargs):
        return self.prefetch_related('created_by', 'created_by__userprofile',
                                     'last_modified_by', 'last_modified_by__userprofile')

    def viewable(self, *args, **kwargs):
        """
        Returns all projects (and sub projects) that are viewable by the current user
        :return: QuerySet
        """

        # in some cases we need to prevent caching of viewable project pks in 'get_all_project_ids_with_permission
        # (it has a cache_for_request-decorator)
        # a previous request might have returned fewer project-pks than there actually are by now, which will result
        # in permission errors for the current request
        # therefore an optional unique cache_id is added as a parameter for this function, the django-request-cache is
        # not returning an old result (because the request parameters are different) and the correct, fresh result of
        # the permission check is returned
        # This was necessary for 'eric.projects.models.handlers.check_workbench_element_relation_with_projects', which
        # returned a project-permission-error when duplicated tasks where added to duplicated projects (Only the
        # original project_pk was returned, but not the duplicated project_pks)
        cache_id = None
        if 'cache_id' in kwargs:
            cache_id = kwargs['cache_id']

        project_pks = self.get_all_project_ids_with_permission(
            self.model, 'view_project', cache_id
        )

        if "all" in project_pks:
            return self.all().distinct()

        return self.filter(
            pk__in=project_pks
        ).distinct()

    def viewable_with_orphans(self, *args, **kwargs):
        """
        Returns all projects (and sub projects) that are view-able by the current user
        :return: QuerySet
        """
        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, 'view_project'
        )

        if "all" in project_pks:
            # can see all projects => there are no orphans => return projects without parents only
            return self.all().filter(
                parent_project__isnull=True
            ).exclude(
                deleted=True
            ).distinct()

        return self.filter(
            pk__in=project_pks
        ).exclude(
            parent_project__in=project_pks
        ).exclude(
            deleted=True
        ).distinct()

    def deletable(self, *args, **kwargs):
        """
        Returns all projects (and sub projects) that are deletable by the current user
        - User must have delete_project permission
        - Project must already be soft deleted (deleted=True)
        :return: QuerySet
        """
        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, 'delete_project'
        )

        if "all" in project_pks:
            return self.filter(deleted=True).distinct()

        return self.filter(
            deleted=True,
            pk__in=project_pks
        ).distinct()

    def restorable(self, *args, **kwargs):
        """
        Returns all projects (and sub projects) that are restorable by the current user
        - User must have restore_project permission
        - Project must already be soft deleted (deleted=True)
        :return: QuerySet
        """
        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, 'restore_project'
        )

        if "all" in project_pks:
            return self.filter(deleted=True).distinct()

        return self.filter(
            deleted=True,
            pk__in=project_pks
        ).distinct()

    def trashable(self, *args, **kwargs):
        """
        Returns all projects (and sub projects) that are trashable by the current user
        - User must have restore_project permission
        - Project must not be soft deleted (deleted=False)
        :return: QuerySet
        """
        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, 'trash_project'
        )

        if "all" in project_pks:
            return self.filter(deleted=False).distinct()

        return self.filter(
            deleted=False,
            pk__in=project_pks
        ).distinct()

    def parent_project_changeable(self, *args, **kwargs):
        """
        Returns all projects (and sub projects) where the parent project attribute of the project is change-able by the
        current user
        :return: QuerySet
        """

        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model,
            'change_parent_project'
        )

        if "all" in project_pks:
            return self.filter(deleted=False).distinct()

        return self.filter(
            pk__in=project_pks
        ).distinct()

    def not_closed_or_deleted_or_canceled(self, *args, **kwargs):
        """
        Returns all projects that are not paused, finished, canceled or deleted
        """
        from eric.projects.models import Project

        return self.exclude(
            project_state__in=[Project.PAUSED, Project.FINISHED, Project.CANCEL, Project.DELETED]
        ).distinct()

    def editable(self, *args, **kwargs):
        """
        Returns all projects (and sub projects) that are edit-able by the current user
        """

        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model,
            'change_project'
        )

        if "all" in project_pks:
            return self.all().distinct()

        return self.filter(
            pk__in=project_pks
        ).distinct()


class ResourceQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for resources
    """

    def viewable(self):
        """
        Returns all elements of the model where
        - the element has general_usage_setting set to global
        - the element has at least one user group of the current user in usage_setting_selected_user_groups
        - the element is associated to a project and the user has the view_model permission on the project (project_pks)
        - the element has the model privilege 'view' or 'full_access' for the current user
        - the element does not have a model privilege 'deny_edit' for the current user (deny_object_ids)
        """
        from eric.projects.models.models import Resource
        user = get_current_user()

        if user.is_anonymous:
            return self.none()
        elif user.is_superuser:
            return self.all()

        # get all projects where the current user has the view_resource permission
        project_pks = BaseProjectPermissionQuerySet.get_all_project_ids_with_permission(
            self.model, get_permission_name_without_app_label(self.model, 'view')
        )

        # return all objects for users with "all" permissions
        if "all" in project_pks:
            return self.all()

        from eric.model_privileges.models import ModelPrivilege

        # get all object ids where view_privilege is set to deny
        deny_object_ids = ModelPrivilege.objects.for_model(self.model).filter(
            user=user,
            view_privilege=ModelPrivilege.DENY
        ).values_list('object_id', flat=True)

        return self.filter(
            Q(
                # all resources where general_usage_setting is set to global
                general_usage_setting=Resource.GLOBAL
            ) | Q(
                # all resources where the user group of the current user is selected
                usage_setting_selected_user_groups__pk__in=user.groups.values_list('pk')
            ) | Q(
                # all resources where the current user gets permissions from a project
                projects__pk__in=project_pks
            ) | Q(
                # get all entities where the current user is the owner
                model_privileges__full_access_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | Q(
                # get all entities where the current user has read access
                model_privileges__view_privilege=ModelPrivilege.ALLOW,
                model_privileges__user=user
            ) | self._get_extended_viewable_filters()
        ).exclude(
            # exclude all entities that are listed in deny object ids
            id__in=deny_object_ids
        ).distinct()

    def study_rooms(self):
        return self.filter(study_room_info__isnull=False)


class UserStorageLimitQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet for user storage limit - does not need any special permissions
    """
    pass


class RoleQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    """
    Basic QuerySet for projects.Role model
    """

    def viewable(self):
        return self.all()

    def editable(self):
        user = get_current_user()

        if user.has_perm('projects.change_role'):
            return self.all()

        return self.none()

    def deletable(self):
        user = get_current_user()

        if user.has_perm('projects.delete_role'):
            return self.all()

        return self.none()


class ElementLockQuerySet(BaseQuerySet):
    def for_model(self, model_class, model_pk, *args, **kwargs):
        """
        Get element locks for a specific model and primary key
        :param model_class: Class of the Model that needs to be filtered
        :param model_pk: Primary Key of the Object that needs to be filtered
        """

        return self.filter(
            content_type=model_class.get_content_type(),
            object_id=model_pk
        )

    def editable(self, *args, **kwargs):
        return self.filter(
            locked_by=get_current_user()
        )

    def deletable(self, *args, **kwargs):
        """
        Allow deleting an element lock if it has been locked by the current user
        """
        timedelta = timezone.timedelta(minutes=site_preferences.element_lock_time_in_minutes)
        timedelta_webdav = timezone.timedelta(minutes=site_preferences.element_lock_webdav_time_in_minutes)

        return self.filter(
            Q(
                locked_by=get_current_user()
            ) | Q(
                webdav_lock=False,
                locked_at__lte=timezone.now() - timedelta,
            ) | Q(
                webdav_lock=True,
                locked_at__lte=timezone.now() - timedelta_webdav,
            )
        )
