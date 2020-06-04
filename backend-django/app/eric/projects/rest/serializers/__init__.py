#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.db import transaction
from django.db.models import Count
from rest_framework import serializers
from rest_framework.fields import SerializerMethodField
from rest_framework_nested.serializers import NestedHyperlinkedIdentityField

from eric.core.rest.serializers import BaseModelSerializer, HyperlinkedToListField, HyperlinkedQueryToListField, \
    BaseModelWithCreatedBySerializer, PublicUserSerializer, BaseModelWithCreatedByAndSoftDeleteSerializer
from eric.projects.models import Project, ProjectRoleUserAssignment, Role
from eric.projects.models import UserStorageLimit
from eric.projects.rest.serializers.changeset import ChangeSetSerializer, ChangeRecordSerializer
# import serializers from this package
from eric.projects.rest.serializers.resource import ResourceSerializer
from eric.shared_elements.models import Task
from eric.userprofile.rest.serializers import MyUserProfileSerializer

User = get_user_model()


class MinimalisticProjectSerializer(serializers.ModelSerializer):
    """ A very minimalistic project serializer, only displaying name and pk """

    class Meta:
        model = Project
        fields = ('pk', 'name', 'parent_project')


class ProjectTreeSerializer(serializers.ModelSerializer):
    """
    Recursively walks through sub_projects of current object,
    returning their name, pk and sub_projects
    """
    child_tree = SerializerMethodField()

    class Meta:
        model = Project
        fields = ('pk', 'name', 'child_tree')

    def get_child_tree(self, project):
        if project.sub_projects is not None:
            return ProjectTreeSerializer(project.sub_projects.all(), many=True).data
        else:
            return None


class PermissionSerializer(serializers.ModelSerializer):
    """ A minimalistic permission serializer """

    class Meta:
        model = Permission
        fields = ('id', 'codename', 'content_type')
        read_only_fields = ('id', 'codename', 'content_type')


class MinimalisticRoleSerializer(serializers.ModelSerializer):
    """ Minimalistic Serializer for Roles """

    class Meta:
        model = Role
        fields = ('pk', 'name', 'default_role_on_project_create', 'default_role_on_project_user_assign')


class RoleSerializerExtended(BaseModelSerializer):
    """ Serializer for Roles """
    permissions = PermissionSerializer(read_only=True, many=True, required=False)

    class Meta:
        model = Role
        fields = ('name', 'permissions', 'default_role_on_project_create', 'default_role_on_project_user_assign')


class ProjectRoleUserAssignmentSerializerExtended(BaseModelWithCreatedBySerializer):
    """ Serializer for ProjectRoleUserAssignment """

    url = NestedHyperlinkedIdentityField(
        view_name='projectroleuserassignment-detail',
        parent_lookup_kwargs={'project_pk': 'project__pk'},
        lookup_url_kwarg='pk',
        lookup_field='pk'
    )

    # add the user serializer with read only
    user = PublicUserSerializer(read_only=True)

    # add the users primary key (yes, we add user and user_pk on purpose; one time with read_only)
    user_pk = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        many=False,
        required=True
    )

    # add the role serializer with read only
    role = MinimalisticRoleSerializer(read_only=True)

    # add the role primary key (same reason as for the user)
    role_pk = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        many=False,
        required=True
    )

    class Meta:
        model = ProjectRoleUserAssignment
        fields = ('url', 'project', 'role_pk', 'user_pk', 'role', 'user')


class ProjectBreadcrumbSerializer(BaseModelSerializer):
    class Meta:
        model = Project
        fields = ('name',)


class ProjectSerializerExtended(BaseModelWithCreatedByAndSoftDeleteSerializer):
    """ Serializer for Project, setting created_by and created_at to read_only """
    # url for ACL-list
    acls = HyperlinkedToListField(
        view_name="projectroleuserassignment-list",
        lookup_field_name='project_pk'
    )

    # url for breadcrumb-list
    breadcrumbs = HyperlinkedToListField(
        view_name="projectbreadcrumb-list",
        lookup_field_name='project_pk'
    )

    # url for contact-list
    contacts = HyperlinkedQueryToListField(
        view_name="contact-list",
        lookup_field_name='project'
    )

    # url for dmp-list
    dmps = HyperlinkedQueryToListField(
        view_name="dmp-list",
        lookup_field_name='project'
    )

    # url for file-list
    files = HyperlinkedQueryToListField(
        view_name="file-list",
        lookup_field_name='project'
    )

    # url for meeting-list
    meetings = HyperlinkedQueryToListField(
        view_name="meeting-list",
        lookup_field_name='project'
    )

    # url for meeting-list
    resources = HyperlinkedQueryToListField(
        view_name="resource-list",
        lookup_field_name='project'
    )

    # url for note-list
    notes = HyperlinkedQueryToListField(
        view_name="note-list",
        lookup_field_name='project'
    )

    # url for task-list
    tasks = HyperlinkedQueryToListField(
        view_name="task-list",
        lookup_field_name='project'
    )

    # url for changeset-list
    history = HyperlinkedToListField(
        view_name="projects_changeset-list",
        lookup_field_name='project_pk'
    )

    tasks_status = serializers.SerializerMethodField()

    project_tree = MinimalisticProjectSerializer(read_only=True, many=True)

    class Meta:
        model = Project
        fields = (
            'name',
            'created_by', 'created_at',
            'project_state', 'description', 'start_date', 'stop_date',
            'parent_project', 'version_number',
            'dmps',
            'acls',
            'breadcrumbs',
            'tasks', 'contacts', 'meetings',
            'notes', 'files', 'history',
            'current_users_project_permissions_list',
            'tasks_status',
            'url',
            'resources',
            'project_tree',
        )
        read_only_fields = (
            'created_by', 'created_at',
            'current_users_project_permissions_list',
            'project_tree',
        )

    def get_tasks_status(self, instance):
        """
        Task Status (Group By)
        Collects a task list and groups it by Task.TASK_STATE_CHOICES
        :param instance:
        :return: dictionary with task states and count(*)
        """
        # group by requires to clear the default ordering by calling order_by()
        # this is: SELECT state, COUNT(*) FROM Tasks GROUP BY state

        # get all tasks for this project and the sub projects (by pk)
        tasks = Task.objects.for_project(instance.pk).exclude(deleted=True)\
            .order_by('pk').distinct('pk').values_list('pk', flat=True)

        # annotate these tasks
        qs = Task.objects.filter(pk__in=tasks).order_by().values('state').annotate(count=Count('state'))

        # collect task choices
        status = {}
        for choice, value in Task.TASK_STATE_CHOICES:
            status[choice] = 0

        # collect result from qs
        for row in qs:
            status[row['state']] = row['count']

        return status


class InviteUserSerializer(serializers.Serializer):
    """ Serializer for inviting a user """
    email = serializers.EmailField()
    message = serializers.CharField(allow_blank=True)


class MyUserSerializer(serializers.ModelSerializer):
    """ PublicUserSerializer defines the API representation and serializes the publicly available users fields:
    url, username, first_name, last_name, email, is_staff, and userprofile related fields """

    userprofile = MyUserProfileSerializer(many=False, required=False)

    available_storage_megabyte = serializers.SerializerMethodField()

    permissions = serializers.SerializerMethodField()

    used_storage_megabyte = serializers.SerializerMethodField()

    def get_permissions(self, user):
        return user.get_all_permissions()

    def get_used_storage_megabyte(self, user):
        return UserStorageLimit.calculate_used_storage(user)

    def get_available_storage_megabyte(self, user):
        if hasattr(user, 'user_storage_limit') and user.user_storage_limit is not None:
            return user.user_storage_limit.storage_megabyte
        else:
            return 0

    class Meta:
        model = User
        fields = ('pk', 'url', 'username', 'is_staff', 'userprofile', 'email',
                  'is_active', 'permissions', 'used_storage_megabyte', 'available_storage_megabyte')
        read_only_fields = ('username', 'is_staff', 'is_active', 'permissions')

    def update(self, instance, validated_data):
        """
            For nested data (user profile), we need to define a special update method
            only normal user are allowed to update their data, not ldap users
            ldap users are only allowed to edit the additional_information field
        """
        profile_data = None

        if 'userprofile' in validated_data:
            profile_data = validated_data.pop('userprofile')

        with transaction.atomic():
            # handle update of user profile data
            if profile_data is not None:
                userprofile_serializer = MyUserProfileSerializer(instance=instance.userprofile, data=profile_data)
                userprofile_serializer.is_valid(raise_exception=True)

                instance.userprofile = userprofile_serializer.update(
                    instance.userprofile,
                    userprofile_serializer.validated_data
                )

            # update user instance
            instance = super(MyUserSerializer, self).update(instance, validated_data)

        return instance
