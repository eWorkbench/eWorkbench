#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import re

from django.db.models.signals import post_save, pre_delete, pre_save
from django.dispatch import receiver
from django.utils.translation import gettext as _

from rest_framework.exceptions import PermissionDenied

from eric.core.models import disable_permission_checks
from eric.drives.models import Directory, Drive
from eric.projects.models.handlers import check_create_roles_for_other_workbench_elements
from eric.shared_elements.models import File, ValidationError


@receiver(post_save, sender=Drive)
def create_new_root_directory_for_drive(instance, created, *args, **kwargs):
    """
    When a drive is created, auto create a virtual root directory for it
    :param instance:
    :param created:
    :param args:
    :param kwargs:
    :return:
    """
    if created:
        Directory.objects.create(drive=instance, name="/", is_virtual_root=True)


@receiver(pre_save, sender=Directory)
def ensure_only_one_root_directory(instance, *args, **kwargs):
    """
    Ensure that a drive only has a single root directory
    All other directories and files need to be within that directory
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    if instance.is_virtual_root:
        # check if any virtual roots already exist
        existing_roots = Directory.objects.filter(drive=instance.drive, is_virtual_root=True).exclude(pk=instance.pk)

        # ensure this is the only root directory
        if existing_roots.exists():
            raise ValidationError(
                {
                    "directory": ValidationError(
                        _("You are not allowed to create a new folder here"),
                        params={"directory": instance.directory_id},
                        code="invalid",
                    )
                }
            )

        # ensure this instance always has "/" as the name
        if instance.name != "/":
            raise ValidationError(
                {
                    "name": ValidationError(
                        _("You can not rename the root folder"), params={"name": instance.name}, code="invalid"
                    )
                }
            )

        if instance.directory is not None:
            raise ValidationError(
                {
                    "directory": ValidationError(
                        _("You are not allowed to move the root folder"),
                        params={"directory": instance.directory_id},
                        code="invalid",
                    )
                }
            )

    elif instance.directory is None:
        raise ValidationError(
            {
                "directory": ValidationError(
                    _("You need to select a directory"), params={"directory": instance.directory}, code="invalid"
                )
            }
        )


@receiver(pre_save, sender=File)
def verify_edit_permission_of_directory(instance, *args, **kwargs):
    """
    When a file is saved, check that the current user is allowed to set the directory
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    # check if this is a new instance
    existing_file = File.objects.filter(pk=instance.pk).first()

    if existing_file:
        # check source directory - needs to be editable
        if existing_file.directory != instance.directory:
            if existing_file.directory and not existing_file.directory.is_editable():
                raise ValidationError(
                    {
                        "directory_id": ValidationError(
                            _("You are not allowed to remove the file from the selected folder"),
                            params={"directory_id": instance.directory_id},
                            code="invalid",
                        )
                    }
                )

    # check target directory - target directory needs to be editable
    if instance.directory:
        # check if the current user is allowed to edit this directory
        if instance.directory and not instance.directory.is_editable():
            raise ValidationError(
                {
                    "directory_id": ValidationError(
                        _("You are not allowed to create a file in the selected folder"),
                        params={"directory_id": instance.directory_id},
                        code="invalid",
                    )
                }
            )


def rename_file_increase_number(filename):
    """
    Renames a file in as follows:
    file.ext gets renamed fo file (1).ext
    file (integer).ext gets renamed to file (integer+1).ext
    :param filename:
    :return:
    """
    # strip extension
    if "." in filename:
        extension = filename.split(".")[-1]
        new_filename = filename.replace("." + extension, "")
    else:
        extension = ""
        new_filename = filename

    # check if filename contains brackets ( ) with a number at the end
    regex = re.compile(r"\((\d+)\)$")

    matches = regex.findall(new_filename)

    if not matches or len(matches) == 0:
        new_filename = new_filename + " (1)"
    else:
        cur_number = int(matches[0]) + 1
        new_filename = regex.sub(f"({cur_number})", new_filename)

    if extension != "":
        new_filename += "." + extension

    return new_filename


@receiver(pre_save, sender=File)
def handle_duplicate_filenames_in_directory(instance, *args, **kwargs):
    try:
        if instance.directory.pk:

            cnt = 0

            while cnt < 10:
                # get all files that are in the same directory and have the same name
                files = (
                    File.objects.not_deleted()
                    .filter(directory=instance.directory, original_filename=instance.original_filename)
                    .exclude(pk=instance.pk)
                )

                if not files.exists():
                    # done
                    break

                # else:  a file with the same name exists, rename it
                instance.original_filename = rename_file_increase_number(instance.original_filename)

                cnt += 1

            if cnt >= 10:
                raise ValidationError({"non_field_errors": ValidationError(_("Duplicate name"), code="invalid")})
    except ValidationError:
        raise
    except Exception:
        # no parent directory set, ignore it
        pass


@receiver(pre_delete, sender=Directory)
def on_delete_directory_trash_all_files(instance, *args, **kwargs):
    """
    If a directory is deleted, we need to trash all files within the directory
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    # get all files that are trashable and within the directory
    files = File.objects.trashable().filter(directory=instance)

    # disable permission checks for file, we are only trashing files that are "trashable" anyway!
    with disable_permission_checks(File):
        for file in files:
            file.trash()


@receiver(pre_save, sender=Directory)
def ensure_parent_directory_is_within_same_drive(instance, *args, **kwargs):
    """
    Ensures that the parent directory of a directory is within the same drive
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    if instance.directory is None:
        # no parent set, ignore
        return

    if instance.directory.drive != instance.drive:
        raise ValidationError(
            {
                "directory": ValidationError(
                    _("Parent folder needs to be in the same Storage"),
                    params={"directory": instance.directory},
                    code="invalid",
                )
            }
        )


@receiver(check_create_roles_for_other_workbench_elements)
def check_create_roles_for_drive_directory(user, sender, instance, *args, **kwargs):
    """
    Checks if the current user is allowed to create something that is related to drive (e.g. creating a new directory)

    This is a sub-method called by `check_create_roles` (via the signal
    `check_create_roles_for_other_workbench_elements`) if `instance` is related to a `Drive`
    :param user:
    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    if not hasattr(instance, "drive"):
        # not related to a drive
        return

    # check if the drive is editable (if not, it's just not allowed)
    if not instance.drive.is_editable():
        raise PermissionDenied
