#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from datetime import timedelta, datetime

import jwt
import logging
from django.db import transaction
from django.contrib.auth import get_user_model
from django.conf import settings
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django_userforeignkey.request import get_current_request

from rest_framework import serializers
from rest_framework_nested.relations import NestedHyperlinkedIdentityField

from eric.core.rest.serializers import BaseModelSerializer, \
    BaseModelWithCreatedByAndSoftDeleteSerializer
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField
from eric.kanban_boards.models import KanbanBoard, KanbanBoardColumn, KanbanBoardColumnTaskAssignment
from eric.shared_elements.rest.serializers import TaskSerializer
from eric.shared_elements.models import Task

logger = logging.getLogger(__name__)
User = get_user_model()


class InternalKanbanBoardColumnSerializer(BaseModelSerializer):
    """
    KanbanBoardColumnSerializer which shows Kanban Board Columns title, color, ordering, task_type
    """
    # we need to define the pk serializer here such that we can distinguish between updates and create
    pk = serializers.UUIDField(read_only=False, required=False)

    class Meta:
        model = KanbanBoardColumn
        fields = (
            'pk', 'title', 'color', 'ordering', 'color', 'icon'
        )


class InternalKanbanBoardSerializer(BaseModelSerializer):
    class Meta:
        model = KanbanBoard
        fields = (
            'pk', 'title'
        )


class MinimalisticKanbanBoardColumnTaskAssignmentSerializer(BaseModelSerializer):
    """
    KanbanBoardColumnSerializer for the kanban board column task assignment
    """

    class Meta:
        model = KanbanBoardColumnTaskAssignment
        fields = (
            'pk',
            'kanban_board',
            'kanban_board_column', 'url',
        )

    kanban_board = InternalKanbanBoardSerializer(
        read_only=True, many=False,
        source='kanban_board_column.kanban_board'
    )

    kanban_board_column = InternalKanbanBoardColumnSerializer(read_only=True, many=False)

    url = NestedHyperlinkedIdentityField(
        view_name='kanbanboard-tasks-detail',
        parent_lookup_kwargs={'kanbanboard_pk': 'kanban_board_column__kanban_board__pk'},
        lookup_url_kwarg='pk',
        lookup_field='pk'
    )


class KanbanBoardColumnTaskAssignmentSerializer(BaseModelSerializer):
    """
    KanbanBoardColumnSerializer for the kanban board column task assignment
    """
    class Meta:
        model = KanbanBoardColumnTaskAssignment
        fields = (
            'pk', 'kanban_board_column', 'ordering', 'task', 'task_id', 'url', 'num_related_notes'
        )

    url = NestedHyperlinkedIdentityField(
        view_name='kanbanboard-tasks-detail',
        parent_lookup_kwargs={'kanbanboard_pk': 'kanban_board_column__kanban_board__pk'},
        lookup_url_kwarg='pk',
        lookup_field='pk'
    )

    task = TaskSerializer(
        required=False,
        read_only=True
    )

    task_id = serializers.PrimaryKeyRelatedField(
        # ToDo: We should also provide Task.objects.viewable() here
        queryset=Task.objects.all(),
        source='task',
        many=False,
        required=False,
        allow_null=True
    )

    num_related_notes = serializers.IntegerField(read_only=True)


class KanbanBoardSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer):
    """
    Serializer for Kanban Boards
    Includes Kanban Board Columns
    """
    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    kanban_board_columns = InternalKanbanBoardColumnSerializer(
        read_only=False,
        many=True,
        required=False
    )

    # provide a download link for the background image
    download_background_image = serializers.SerializerMethodField(
        read_only=True
    )

    # provide a download link for the background image
    download_background_image_thumbnail = serializers.SerializerMethodField(
        read_only=True
    )

    # write only for the background image
    background_image = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = KanbanBoard
        fields = (
            'title', 'projects',
            'kanban_board_columns',
            'background_image', 'download_background_image',
            'background_image_thumbnail', 'download_background_image_thumbnail',
            'background_color',
            'url', 'created_by', 'created_at', 'last_modified_by', 'last_modified_at', 'version_number',
        )

    def get_download_background_image(self, obj):
        if not obj.background_image:
            return None

        request = get_current_request()

        # get the current request path/url and replace "get_export_token" with the target url (which is "export")
        path = reverse('kanbanboard-background-image.png', kwargs={'pk': obj.pk})

        # build an absolute URL for the given apth
        absolute_url = request.build_absolute_uri(path)

        # the token should contain the following information
        payload = {
            'exp': datetime.now() + timedelta(
                hours=settings.WORKBENCH_SETTINGS['download_token_validity_in_hours']
            ),  # expiration time
            # store pk and object type that this object relates to
            'pk': str(obj.pk),
            'object_type': obj.__class__.__name__,
            # store the users primary key
            'user': request.user.pk,
            # store the verification token, so the token can be revoked afterwards
            'jwt_verification_token': request.user.userprofile.jwt_verification_token,
            # store the path that this token is valid for
            'path': path
        }

        # generate JWT with the payload and the secret key
        jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        return "{absolute_url}?jwt={token}".format(
            absolute_url=absolute_url,
            token=jwt_token.decode("utf-8")
        )

    def get_download_background_image_thumbnail(self, obj):
        if not obj.background_image_thumbnail:
            return None

        request = get_current_request()

        # get the current request path/url and replace "get_export_token" with the target url (which is "export")
        path = reverse('kanbanboard-background-image-thumbnail.png', kwargs={'pk': obj.pk})

        # build an absolute URL for the given apth
        absolute_url = request.build_absolute_uri(path)

        # the token should contain the following information
        payload = {
            'exp': datetime.now() + timedelta(
                hours=settings.WORKBENCH_SETTINGS['download_token_validity_in_hours']
            ),  # expiration time
            # store pk and object type that this object relates to
            'pk': str(obj.pk),
            'object_type': obj.__class__.__name__,
            # store the users primary key
            'user': request.user.pk,
            # store the verification token, so the token can be revoked afterwards
            'jwt_verification_token': request.user.userprofile.jwt_verification_token,
            # store the path that this token is valid for
            'path': path
        }

        # generate JWT with the payload and the secret key
        jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        return "{absolute_url}?jwt={token}".format(
            absolute_url=absolute_url,
            token=jwt_token.decode("utf-8")
        )

    def create(self, validated_data):
        """
        Override create method 0f KanbanBoardSerializer such that we can handle sub-serializers for
        - kanban_board_columns
        If a kanban board is created without columns, we add the default columns to the board
        :param validated_data: validated data of the serializer
        :return: KanbanBoard
        """
        kanban_board_columns = None

        # get kanban board columns from validated data (if it is available)
        if 'kanban_board_columns' in validated_data:
            kanban_board_columns = validated_data.pop('kanban_board_columns')

        # create the kanban board using KanbanBoardSerializer (hence we needed to remove kanban_board_columns)
        instance = super(KanbanBoardSerializer, self).create(validated_data)

        # now create columns (if set)
        if kanban_board_columns:
            for item in kanban_board_columns:
                KanbanBoardColumn.objects.create(
                    kanban_board=instance,
                    title=item['title'],
                    ordering=item['ordering'],
                    color=item['color'],
                    icon=item['icon']
                )
        else:
            # no kanban board columns set, create a default column "new"
            ordering = 0

            KanbanBoardColumn.objects.create(
                ordering=0,
                title=_("New"),
                kanban_board=instance
            )

        # save the instance again so we trigger the changeset
        instance.save()

        return instance

    def update(self, instance, validated_data):
        """
        Override update method of KanbanBoardSerializer such that we can handle sub-serializers for
        - kanban_board_columns
        :param instance: the instance that is being updated
        :param validated_data: validated data of the serializer
        :return: KanbanBoard
        """
        kanban_board_columns = None

        # get kanban board columns from validated data (if it is available)
        if 'kanban_board_columns' in validated_data:
            kanban_board_columns = validated_data.pop('kanban_board_columns')

        # start a transaction which handles updating assigned_users, kanban_board_columns and updating the task itself
        with transaction.atomic():
            # update kanban_board_columns
            if kanban_board_columns is not None:
                current_kanban_board_columns_pk = list(instance.kanban_board_columns.values_list('pk', flat=True))

                for item in kanban_board_columns:
                    if 'pk' in item:
                        # update existing item
                        real_item = KanbanBoardColumn.objects.filter(kanban_board=instance, pk=item['pk']).first()

                        item_updated = False

                        if item['title'] != real_item.title:
                            real_item.title = item['title']
                            item_updated = True

                        if item['color'] != real_item.color:
                            real_item.color = item['color']
                            item_updated = True

                        if item['ordering'] != real_item.ordering:
                            real_item.ordering = item['ordering']
                            item_updated = True

                        if item.get('icon', '') != real_item.icon:
                            real_item.icon = item.get('icon', '')
                            item_updated = True

                        if item_updated:
                            real_item.save()

                        # remove pk from current_kanban_board_columns_pk
                        try:
                            current_kanban_board_columns_pk.remove(item['pk'])
                        except ValueError as e:
                            logger.error(e)
                    else:
                        # create new item
                        KanbanBoardColumn.objects.create(
                            kanban_board=instance,
                            title=item['title'],
                            icon=item.get('icon', ''),
                            ordering=item['ordering'],
                            color=item['color']
                        )

                # finally, everything that is still in current_kanban_board_columns_pk needs to be removed
                KanbanBoardColumn.objects.filter(pk__in=current_kanban_board_columns_pk).delete()

            # update kanban board instance
            instance = super(KanbanBoardSerializer, self).update(instance, validated_data)

        return instance
