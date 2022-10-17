#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from eric.kanban_boards.models import KanbanBoard, KanbanBoardColumn, KanbanBoardColumnTaskAssignment
from eric.labbooks.models import LabBook, LabBookChildElement, LabbookSection
from eric.pictures.models import Picture
from eric.plugins.models import PluginInstance
from eric.projects.models import ElementLock
from eric.relations.models import Relation
from eric.search.models import FTSMixin
from eric.shared_elements.models import File, Note

logger = logging.Logger(__name__)


@receiver(post_save)
def propagate_workbench_element_changes_via_websocket(sender, instance, created, *args, **kwargs):
    """
    Everytime a workbench element is changed, we notify the channel group about the change
    :param sender:
    :param instance:
    :param created:
    :param args:
    :param kwargs:
    :return:
    """
    if created:
        # ignore items that have just been created
        return

    if not isinstance(instance, FTSMixin):
        # must inherit from FTSMixin
        return

    # get current channel
    channel_layer = get_channel_layer()

    # check if channel layer is available (e.g., in unit tests this is not available)
    if channel_layer:
        model_name = instance.__class__.__name__.lower()

        room_group_name = f"elements_{model_name}_{instance.pk}"

        # notify this channel that this element has changed, and provide the latest version number of the element
        transaction.on_commit(
            lambda: async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "element_changed",
                    "message": {
                        "model_name": model_name,
                        "model_pk": str(instance.pk),
                        "version": instance.version_number,
                    },
                },
            )
        )
    else:
        print("propagate_workbench_element_changes_via_websocket: Channel Layer is not available, not sending...")


@receiver(post_save, sender=ElementLock)
def propagate_workbench_element_lock_changed_via_websocket(instance, *args, **kwargs):
    # get current channel
    channel_layer = get_channel_layer()

    element = instance.content_object

    # check if channel layer is available (e.g., in unit tests this is not available)
    if channel_layer:
        model_name = element.__class__.__name__.lower()

        room_group_name = f"elements_{model_name}_{element.pk}"

        # notify this channel that this element has been locked
        transaction.on_commit(
            lambda: async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "element_lock_changed",
                    "message": {
                        "locked": True,
                        "model_name": model_name,
                        "model_pk": str(element.pk),
                    },
                },
            )
        )
    else:
        print("propagate_workbench_element_lock_changed_via_websocket: Channel Layer is not available, not sending...")


@receiver(post_delete, sender=ElementLock)
def propagate_workbench_element_lock_deleted_via_websocket(instance, *args, **kwargs):
    # print("In @post_delete: An ElementLock was deleted: {}".format(instance.pk))

    # get current channel
    channel_layer = get_channel_layer()
    element = instance.content_object

    # check if channel layer is available (e.g., in unit tests this is not available)
    if channel_layer and element:
        model_name = element.__class__.__name__.lower()

        room_group_name = f"elements_{model_name}_{element.pk}"

        print(f"Sending a notification that an element lock has been removed to {room_group_name}")

        # notify this channel that this element has been unlocked
        transaction.on_commit(
            lambda: async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "element_lock_changed",
                    "message": {
                        "locked": False,
                        "model_name": model_name,
                        "model_pk": str(element.pk),
                    },
                },
            )
        )
    else:
        print("propagate_workbench_element_lock_deleted_via_websocket: Channel Layer is not available, not sending...")


@receiver(post_save, sender=Relation)
def propagate_workbench_relations_changes_via_websocket(instance, *args, **kwargs):
    """
    :param eric.relations.models.Relation instance: the relation that is being saved
    :param args:
    :param kwargs:
    :return:
    """
    print("In @post_save of Relations: a relation was created/modified")

    # get current channel
    channel_layer = get_channel_layer()

    # check if channel layer is available (e.g., in unit tests this is not available)
    if channel_layer:
        # construct room group names for both elements within the relation
        left_model_name = instance.left_content_type.model_class().__name__.lower()
        left_pk = instance.left_object_id
        left_room_group_name = f"elements_{left_model_name}_{left_pk}"

        right_model_name = instance.right_content_type.model_class().__name__.lower()
        right_pk = instance.right_object_id
        right_room_group_name = "elements_{model_name}_{model_pk}".format(
            model_name=right_model_name, model_pk=right_pk
        )

        print(
            "Sending a notification for a new relation for {} and {}".format(
                left_room_group_name, right_room_group_name
            )
        )

        # notify both channels about the change
        async_to_sync(channel_layer.group_send)(
            left_room_group_name,
            {"type": "element_relations_changed", "message": {"model_name": left_model_name, "model_pk": str(left_pk)}},
        )

        async_to_sync(channel_layer.group_send)(
            right_room_group_name,
            {
                "type": "element_relations_changed",
                "message": {"model_name": right_model_name, "model_pk": str(right_pk)},
            },
        )

    else:
        print("propagate_workbench_relations_changes_via_websocket: Channel Layer is not available, not sending...")


@receiver(post_save, sender=KanbanBoardColumnTaskAssignment)
def kanbanboard_column_task_assignment_changed(instance, *args, **kwargs):
    """
    :param eric.kanban_boards.models.KanbanBoardColumnTaskAssignment instance: the assignment that is being saved
    :param args:
    :param kwargs:
    :return:
    """
    print("In @post_save of KanbanBoardColumnTaskAssignment: an assignment has changed")

    # get current channel
    channel_layer = get_channel_layer()

    # check if channel layer is available (e.g., in unit tests this is not available)
    if channel_layer:
        model_name = KanbanBoard.__name__.lower()

        room_group_name = "elements_{model_name}_{model_pk}".format(
            model_name=model_name, model_pk=instance.kanban_board_column.kanban_board.pk
        )

        print(f"Sending a notification that an assignment has changed to {room_group_name}")

        # notify this channel that this element has changed
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                "type": "kanbanboard_task_assignment_changed",
                "message": {
                    "model_name": model_name,
                    "model_pk": str(instance.kanban_board_column.kanban_board.pk),
                    "id": str(instance.pk),
                    "task_id": str(instance.task.pk),
                },
            },
        )
    else:
        print("kanbanboard_column_task_assignment_changed: Channel Layer is not available, not sending...")


@receiver(post_delete, sender=KanbanBoardColumnTaskAssignment)
def kanbanboard_column_task_assignment_deleted(instance, *args, **kwargs):
    """
    :param eric.kanban_boards.models.KanbanBoardColumnTaskAssignment instance: the assignment that is being deleted
    :param args:
    :param kwargs:
    :return:
    """
    print("In @post_save of KanbanBoardColumnTaskAssignment: an assignment has been removed")

    # get current channel
    channel_layer = get_channel_layer()

    # check if channel layer is available (e.g., in unit tests this is not available)
    # and if the entry for instance.kanban_board_column.kanban_board exists
    if channel_layer and instance.kanban_board_column.kanban_board is not None:
        model_name = KanbanBoard.__name__.lower()

        room_group_name = "elements_{model_name}_{model_pk}".format(
            model_name=model_name, model_pk=instance.kanban_board_column.kanban_board.pk
        )

        print(f"Sending a notification that an assignment has changed to {room_group_name}")

        # notify this channel that this element has changed
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                "type": "kanbanboard_task_assignment_deleted",
                "message": {
                    "model_name": model_name,
                    "model_pk": str(instance.kanban_board_column.kanban_board.pk),
                    "id": str(instance.pk),
                    "task_id": str(instance.task.pk),
                },
            },
        )
    else:
        print(
            "kanbanboard_column_task_assignment_deleted: Channel Layer is not available or "
            "instance.kanban_board_column.kanban_board is null, not sending..."
        )


@receiver(post_save, sender=KanbanBoardColumn)
@receiver(post_delete, sender=KanbanBoardColumn)
def kanbanboard_column_changed(instance, *args, **kwargs):
    """
    :param eric.kanban_boards.models.KanbanBoardColumn instance: the column that is being changed
    :param args:
    :param kwargs:
    :return:
    """
    print("In @post_save of KanbanBoardColumn: a column has changed")

    # get current channel
    channel_layer = get_channel_layer()

    # check if channel layer is available (e.g., in unit tests this is not available)
    if channel_layer and instance.kanban_board:
        model_name = KanbanBoard.__name__.lower()

        room_group_name = "elements_{model_name}_{model_pk}".format(
            model_name=model_name, model_pk=instance.kanban_board.pk
        )

        print(f"Sending a notification that a column has changed to {room_group_name}")

        # notify this channel that this element has changed
        transaction.on_commit(
            lambda: async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "kanbanboard_column_changed",
                    "message": {
                        "model_name": model_name,
                        "model_pk": str(instance.kanban_board.pk),
                        "id": str(instance.pk),
                    },
                },
            )
        )

    else:
        print("kanbanboard_column_changed: Channel Layer is not available, not sending...")


@receiver(post_save, sender=LabBookChildElement)
@receiver(post_delete, sender=LabBookChildElement)
def labbook_child_element_changed(instance, *args, **kwargs):
    """
    :param eric.labbooks.models.LabBookChildElement instance: the child element that is being changed
    :param args:
    :param kwargs:
    :return:
    """
    print("In @post_save of LabBookChildelement: a column has changed")

    # get current channel
    channel_layer = get_channel_layer()

    # check if channel layer is available (e.g., in unit tests this is not available)
    if channel_layer and instance.lab_book:
        model_name = LabBook.__name__.lower()

        room_group_name = "elements_{model_name}_{model_pk}".format(
            model_name=model_name, model_pk=instance.lab_book.pk
        )

        print(f"Sending a notification that a child element has changed to {room_group_name}")

        # notify this channel that this element has changed
        transaction.on_commit(
            lambda: async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "labbook_child_element_changed",
                    "message": {
                        "model_name": model_name,
                        "model_pk": str(instance.lab_book.pk),
                        "id": str(instance.pk),
                    },
                },
            )
        )

    else:
        print("labbook_child_element_changed: Channel Layer is not available, not sending...")


@receiver(post_save, sender=Note)
@receiver(post_save, sender=Picture)
@receiver(post_save, sender=File)
@receiver(post_save, sender=PluginInstance)
@receiver(post_save, sender=LabbookSection)
@receiver(post_delete, sender=Note)
@receiver(post_delete, sender=Picture)
@receiver(post_delete, sender=File)
@receiver(post_delete, sender=PluginInstance)
@receiver(post_delete, sender=LabbookSection)
def labbook_child_element_object_changed(instance, *args, **kwargs):
    """
    :param instance: the child element object that is being changed
    :param args:
    :param kwargs:
    :return:
    """
    print("In @post_save of labbook_child_element_object_changed: a child element object has changed")

    # Check if this object is a LabBook child element
    child_element = (
        LabBookChildElement.objects.editable()
        .filter(child_object_content_type=instance.get_content_type(), child_object_id=instance.pk)
        .first()
    )

    if not child_element:
        return

    # get current channel
    channel_layer = get_channel_layer()

    # check if channel layer is available (e.g., in unit tests this is not available)
    if channel_layer and child_element.lab_book:
        model_name = LabBook.__name__.lower()

        room_group_name = "elements_{model_name}_{model_pk}".format(
            model_name=model_name, model_pk=child_element.lab_book.pk
        )

        print(f"Sending a notification that a child element object has changed to {room_group_name}")

        # notify this channel that this element has changed
        transaction.on_commit(
            lambda: async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "labbook_child_element_changed",
                    "message": {
                        "model_name": model_name,
                        "model_pk": str(child_element.lab_book.pk),
                        "id": str(child_element.pk),
                    },
                },
            )
        )

    else:
        print("labbook_child_element_changed: Channel Layer is not available, not sending...")
