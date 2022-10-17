#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import serializers

from eric.core.rest.serializers import (
    BaseModelSerializer,
    BaseModelWithCreatedByAndSoftDeleteSerializer,
    BaseModelWithCreatedBySerializer,
    PublicUserSerializer,
)
from eric.metadata.rest.serializers import EntityMetadataSerializer, EntityMetadataSerializerMixin
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField
from eric.shared_elements.models import Task, TaskAssignedUser, TaskCheckList
from eric.shared_elements.rest.serializers.element_label import ElementLabelPrimaryKeyRelatedField

User = get_user_model()


class MinimalisticTaskSerializer(BaseModelWithCreatedBySerializer):
    """
    A very minimalistic (read only) task serializer
    Can be used if you just want a quick serialization of tasks (e.g., for the schedule)
    """

    assigned_users = PublicUserSerializer(read_only=True, many=True)

    class Meta:
        model = Task
        fields = (
            "title",
            "start_date",
            "due_date",
            "priority",
            "state",
            "description",
            "task_id",
            "assigned_users",
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
            "full_day",
            "is_favourite",
        )


class TaskCheckListItemSerializer(BaseModelSerializer):
    """
    TaskCheckListItem Serializer which shows TaskCheckList title (varchar) and checked (boolean)
    """

    # we need to define the pk serializer here such that we can distinguish between updates and create
    pk = serializers.UUIDField(read_only=False, required=False)

    class Meta:
        model = TaskCheckList
        fields = (
            "title",
            "checked",
            "pk",
            "ordering",
        )


class TaskSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """REST API Serializer for Tasks"""

    assigned_users = PublicUserSerializer(read_only=True, many=True)

    assigned_users_pk = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="assigned_users", many=True, required=False
    )

    checklist_items = TaskCheckListItemSerializer(read_only=False, many=True, required=False)

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    labels = ElementLabelPrimaryKeyRelatedField(many=True, required=False)

    metadata = EntityMetadataSerializer(
        read_only=False,
        many=True,
        required=False,
    )

    class Meta:
        model = Task
        fields = (
            "title",
            "start_date",
            "due_date",
            "priority",
            "state",
            "description",
            "projects",
            "task_id",
            "assigned_users",
            "assigned_users_pk",
            "checklist_items",
            "labels",
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
            "version_number",
            "url",
            "metadata",
            "full_day",
            "is_favourite",
            "remind_assignees",
            "reminder_datetime",
        )
        read_only_fields = ("assigned_users",)

    @transaction.atomic
    def create(self, validated_data):
        """
        Override create method of TaskSerializer such that we can handle sub-serializers for
         - assigned_users
         - checklist_items
         - labels
         - metadata
        :param validated_data: validated data of the serializer
        :return: Task
        """
        assigned_users = None
        checklist_items = None
        metadata_list = self.pop_metadata(validated_data)

        # get assigned users from validated data (if it is available)
        if "assigned_users" in validated_data:
            assigned_users = validated_data.pop("assigned_users")

        # get checklist items from validated data (if it is available)
        if "checklist_items" in validated_data:
            checklist_items = validated_data.pop("checklist_items")

        # create the task using TaskSerializer (hence we needed to remove assigned_users and checklist_items)
        instance = super().create(validated_data)

        # now create assigned users
        if assigned_users:
            for user in assigned_users:
                # instance.assigned_users.add(user)
                TaskAssignedUser.objects.create(task=instance, assigned_user=user)

        # and checklist items
        if checklist_items:
            for item in checklist_items:
                TaskCheckList.objects.create(
                    task=instance, title=item["title"], checked=item["checked"], ordering=item["ordering"]
                )

        self.create_metadata(metadata_list, instance)

        # save instance again so we can trigger the changeset
        instance.save()

        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Override update method of TaskSerializer such that we can handle sub-serializers for
        - assigned_users
         - checklist_items
        :param instance: the instance that is being updated
        :param validated_data: validated data of the serializer
        :return: Task
        """
        assigned_users = None
        checklist_items = None
        metadata_list = self.pop_metadata(validated_data)

        # get assigned users from validated data (if it is available)
        if "assigned_users" in validated_data:
            assigned_users = validated_data.pop("assigned_users")

        # get checklist items from validated data (if it is available)
        if "checklist_items" in validated_data:
            checklist_items = validated_data.pop("checklist_items")

        # update assigned_users
        if assigned_users is not None:
            currently_assigned_users = instance.assigned_users.all()

            users_to_remove = set(currently_assigned_users).difference(assigned_users)

            users_to_add = set(assigned_users).difference(set(currently_assigned_users))

            # handle assigned users that need to be removed
            for user in users_to_remove:
                # The following is equal to: instance.assigned_users.remove(user)
                TaskAssignedUser.objects.filter(task=instance, assigned_user=user).delete()

            # handle assigned users that need to be added
            for user in users_to_add:
                # The following is equal to: instance.assigned_users.add(user)
                TaskAssignedUser.objects.create(task=instance, assigned_user=user)

        # update checklist_items
        if checklist_items is not None:
            current_checklist_items_pk = list(instance.checklist_items.values_list("pk", flat=True))

            for item in checklist_items:
                if "pk" in item:
                    # update existing item
                    real_item = TaskCheckList.objects.filter(task=instance, pk=item["pk"]).first()
                    real_item.checked = item["checked"]
                    real_item.title = item["title"]
                    real_item.ordering = item["ordering"]
                    real_item.save()
                    # remove pk from current_checklist_items_pk
                    current_checklist_items_pk.remove(item["pk"])
                else:
                    # create new item
                    TaskCheckList.objects.create(
                        task=instance,
                        title=item["title"],
                        checked=item["checked"],
                        ordering=item["ordering"],
                    )

            # finally, everything that is still in current_checklist_items_pk needs to be removed
            TaskCheckList.objects.filter(pk__in=current_checklist_items_pk).delete()

        self.update_metadata(metadata_list, instance)

        # update task instance
        instance = super().update(instance, validated_data)

        return instance
