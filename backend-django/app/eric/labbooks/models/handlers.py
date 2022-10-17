#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.exceptions import PermissionDenied
from django.db.models.signals import m2m_changed, post_delete, post_save
from django.dispatch import receiver

from eric.core.models import disable_permission_checks
from eric.labbooks.models import LabBook, LabBookChildElement
from eric.projects.models.handlers import check_create_roles_for_other_workbench_elements


@receiver(post_delete)
def on_delete_labbook_element(sender, instance, *args, **kwargs):
    """
    Followup on a delete of a model that is used in a labbook
    All labbook child elements that use this object need to be deleted too

    This is to ensure that when deleting a note/file/picture/plugin within the workbench,
    we also delete all related labbook child elements
    """
    # check if the current instance is relatable (sanity check)
    if hasattr(instance._meta, "is_relatable") and instance._meta.is_relatable:
        # delete all labbook child elements that use this instance (filtered by content type and object id)
        with disable_permission_checks(LabBookChildElement):
            LabBookChildElement.objects.filter(
                child_object_id=instance.pk, child_object_content_type=instance.get_content_type()
            ).delete()


@receiver(post_save, sender=LabBookChildElement)
def on_add_labbook_child_element_update_projects(instance, created, *args, **kwargs):
    """
    If a child element is added to the labbook, we need to ensure it has the same projects as the labbook
    :param instance:
    :return:
    """
    if created:
        # get all project pks of the labbook
        project_pks = list(instance.lab_book.projects.all().values_list("pk", flat=True))

        # and add it to the child object
        instance.child_object.projects.add(*project_pks)

        # save the child_object, so the changeset is triggered
        instance.child_object.save()


# TODO: Sadly, we can't just update the last_modified_at field as this creates an Error 412 with the changeset
# @receiver(post_save, sender=LabBookChildElement)
# @receiver(post_delete, sender=LabBookChildElement)
# def update_labbook_last_updated_fields_via_child_element(instance, created, *args, **kwargs):
#     """
#     If a child element is changed we must update the last_modified_by field for the parent LabBook.
#     The field last_modified_at will automatically be updated with the current timestamp.
#     :param instance:
#     :return:
#     """
#     if not instance.is_editable() or not instance.lab_book.is_editable():
#         return
#
#     # If the LabBook this element is a part of is trashed we can't update any data, so this check is required.
#     if not instance.lab_book.deleted:
#         instance.lab_book.last_modified_by = instance.last_modified_by
#         instance.lab_book.save()


# TODO: Sadly, we can't just update the last_modified_at field as this creates an Error 412 with the changeset
# @receiver(post_save, sender=Note)
# @receiver(post_save, sender=Picture)
# @receiver(post_save, sender=File)
# @receiver(post_save, sender=PluginInstance)
# @receiver(post_save, sender=LabbookSection)
# @receiver(post_delete, sender=Note)
# @receiver(post_delete, sender=Picture)
# @receiver(post_delete, sender=File)
# @receiver(post_delete, sender=PluginInstance)
# @receiver(post_delete, sender=LabbookSection)
# def update_labbook_last_updated_fields_via_child_element_object(instance, created, *args, **kwargs):
#     """
#     If a child element object is changed we must update the last_modified_by field for the parent LabBook.
#     The field last_modified_at will automatically be updated with the current timestamp.
#     :param instance:
#     :return:
#     """
#     if not instance.is_editable():
#         return
#
#     child_element = LabBookChildElement.objects.editable().filter(
#         child_object_content_type=instance.get_content_type(),
#         child_object_id=instance.pk
#     ).first()
#
#     if not child_element or not child_element.is_editable():
#         return
#
#     # If the LabBook this element is a part of is trashed we can't update any data, so this check is required.
#     if not child_element.lab_book.deleted:
#         child_element.lab_book.last_modified_by = instance.last_modified_by
#         child_element.lab_book.save()


@receiver(m2m_changed, sender=LabBook.projects.through)
def update_projects_of_all_labbook_child_elements(instance, action, *args, **kwargs):
    """
    If the project of a labbook is changing, we need to make sure this is stored in the child elements
    """
    if action != "post_remove" and action != "post_add":
        return

    # get all child elements
    child_elements = instance.child_elements.all()

    if action == "post_remove":
        project_pks = kwargs["pk_set"]

        for project_pk in project_pks:
            for child_element in child_elements:
                child_element.child_object.projects.remove(project_pk)

    elif action == "post_add":
        project_pks = kwargs["pk_set"]

        for project_pk in project_pks:
            for child_element in child_elements:
                child_element.child_object.projects.add(project_pk)

    # finally make sure the child element is saved, so the changeset is triggered
    for child_element in child_elements:
        child_element.child_object.save()


@receiver(check_create_roles_for_other_workbench_elements)
def check_create_roles_for_labbook_child_elements(user, sender, instance, *args, **kwargs):
    """
     Checks if the current user is allowed to create a child element of a labbook
     This is a sub-method called by `check_create_roles` (via the signal
     `check_create_roles_for_other_workbench_elements`) if `instance` is related to a `KanbanBoardColumn`

    :param user:
    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """

    if not hasattr(instance, "lab_book"):
        # not related to a lab book
        return

    # check if the lab book is editable (if not, it's just not allowed)
    if not instance.lab_book.is_editable():
        raise PermissionDenied
