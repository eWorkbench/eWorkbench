#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import os

from django.core.exceptions import ValidationError
from django.db.models.signals import pre_save, post_delete, post_save, pre_delete
from django.dispatch import receiver
from django.utils.translation import ugettext as _

from eric.drives.models import Drive, Directory
from eric.dss.models.models import get_upload_to_path, dss_storage, DSSContainer, DSSEnvelope
from eric.model_privileges.models import ModelPrivilege
from eric.projects.models.exceptions import ContainerReadWriteException
from eric.shared_elements.models import File, UploadedFileEntry

logger = logging.getLogger(__name__)

READ_ONLY = DSSContainer.READ_ONLY
READ_WRITE_NO_NEW = DSSContainer.READ_WRITE_NO_NEW
READ_WRITE_ONLY_NEW = DSSContainer.READ_WRITE_ONLY_NEW
READ_WRITE_ALL = DSSContainer.READ_WRITE_ALL


@receiver(pre_save, sender=File)
def prevent_moving_out_of_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = File.objects.get(pk=instance.pk)
    except File.DoesNotExist:
        pass  # Object is new.
    else:
        # The File was a DSS File and the after saving it wouldn't be anymore -> not allowed
        if obj.is_dss_file and not instance.is_dss_file:
            raise ValidationError({
                'directory_id': ValidationError(
                    _("You are not allowed to move this file out of its DSS container"),
                    params={'directory_id': instance.directory_id},
                    code='invalid'
                )
            })
        # The File would be moved to a directory in another container -> not allowed
        if obj.is_dss_file and instance.is_dss_file:
            obj_container_pk = obj.directory.drive.envelope.container.pk
            instance_container_pk = instance.directory.drive.envelope.container.pk
            if not obj_container_pk == instance_container_pk:
                raise ValidationError({
                    'directory_id': ValidationError(
                        _("You are not allowed to move this file out of its DSS container and into another container"),
                        params={'directory_id': instance.directory_id},
                        code='invalid'
                    )
                })


@receiver(pre_save, sender=File)
def prevent_moving_file_within_read_only_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = File.objects.get(pk=instance.pk)
    except File.DoesNotExist:
        return  # Object is not new.
    else:
        # if the existing file is not in a directory we stop here
        if not obj.directory:
            return

        # if either file isn't a dss file we stop here
        if not obj.is_dss_file or not instance.is_dss_file:
            return

        obj_container = obj.directory.drive.envelope.container
        instance_container = instance.directory.drive.envelope.container

        # if the files aren't in the same container we stop here
        if not obj_container == instance_container:
            return

        # if the read write setting on the container is not read-only we stop here
        if not obj_container.read_write_setting == READ_ONLY:
            return

        if not obj.directory == instance.directory:
            raise ValidationError({
                'directory_id': ValidationError(
                    _("It is not allowed to move files within a read-only DSS container"),
                    params={'directory_id': instance.directory_id},
                    code='invalid'
                )
            })


@receiver(pre_save, sender=Drive)
def prevent_moving_drive_within_read_only_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = Drive.objects.get(pk=instance.pk)
    except Drive.DoesNotExist:
        return  # Object is not new.
    else:
        # if either drive isn't a dss drive we stop here
        if not obj.is_dss_drive or not instance.is_dss_drive:
            return

        obj_container = obj.envelope.container
        instance_container = instance.envelope.container

        # if the drives aren't in the same container we stop here
        if not obj_container == instance_container:
            return

        # if the read write setting on the container is not read-only we stop here
        if not obj_container.read_write_setting == READ_ONLY:
            return

        if not obj.envelope == instance.envelope:
            raise ValidationError({
                'envelope': ValidationError(
                    _("It is not allowed to move storages within read-only DSS containers"),
                    params={'envelope': instance.envelope},
                    code='invalid'
                )
            })


@receiver(pre_save, sender=File)
def prevent_trashing_file_within_read_only_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = File.objects.get(pk=instance.pk)
    except File.DoesNotExist:
        return  # Object is not new.
    else:
        # if the existing file is not in a directory we stop here
        if not obj.directory:
            return

        # if either file isn't a dss file we stop here
        if not obj.is_dss_file or not instance.is_dss_file:
            return

        obj_container = obj.directory.drive.envelope.container

        # if the read write setting on the container is not read-only we stop here
        if not obj_container.read_write_setting == READ_ONLY:
            return

        if obj.deleted is False and instance.deleted is True:
            raise ValidationError({
                'directory_id': ValidationError(
                    _("It is not allowed to trash files within a read-only DSS container"),
                    params={'directory_id': instance.directory_id},
                    code='invalid'
                )
            })


@receiver(pre_save, sender=Drive)
def prevent_trashing_drive_within_read_only_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = Drive.objects.get(pk=instance.pk)
    except Drive.DoesNotExist:
        return  # Object is not new.
    else:
        # if the existing file is not in a directory we stop here
        if not obj.envelope:
            return

        # if either file isn't a dss file we stop here
        if not obj.is_dss_drive or not instance.is_dss_drive:
            return

        obj_container = obj.envelope.container

        # if the read write setting on the container is not read-only we stop here
        if not obj_container.read_write_setting == READ_ONLY:
            return

        if obj.deleted is False and instance.deleted is True:
            raise ValidationError({
                'envelope': ValidationError(
                    _("It is not allowed to trash storages within a read-only DSS container"),
                    params={'envelope': instance.envelope},
                    code='invalid'
                )
            })


@receiver(pre_save, sender=Directory)
def prevent_moving_directory_out_of_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = Directory.objects.get(pk=instance.pk)
    except Directory.DoesNotExist:
        pass  # Object is new.
    else:
        # The Directory was a DSS Directory and the after saving it wouldn't be anymore -> not allowed
        if obj.drive.is_dss_drive and not instance.drive.is_dss_drive:
            raise ValidationError({
                'drive': ValidationError(
                    _("You are not allowed to move this directory out of its DSS container"),
                    params={'drive': instance.drive},
                    code='invalid'
                )
            })
        # The Directory would be moved to a drive in another container -> not allowed
        if obj.drive.is_dss_drive and instance.drive.is_dss_drive:
            obj_container_pk = obj.drive.envelope.container.pk
            instance_container_pk = instance.drive.envelope.container.pk
            if not obj_container_pk == instance_container_pk:
                raise ValidationError({
                    'drive': ValidationError(
                        _("You are not allowed to move this directory out of its DSS container and into "
                          "another container"),
                        params={'drive': instance.drive},
                        code='invalid'
                    )
                })


@receiver(pre_delete, sender=File)
def prevent_deleting_file_in_read_only_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = File.objects.get(pk=instance.pk)
    except File.DoesNotExist:
        pass  # Object is new.
    else:
        if not obj.is_dss_file:
            return
        # if the read write setting on the container is read-only raise an error here, as we won't allow deletion
        if obj.directory.drive.envelope.container.read_write_setting == READ_ONLY:
            raise ValidationError({
                'directory': ValidationError(
                    _("It is not allowed to delete files in read-only DSS containers"),
                    params={'directory': instance.directory},
                    code='invalid'
                )
            })


@receiver(pre_delete, sender=Directory)
def prevent_deleting_directory_in_read_only_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = Directory.objects.get(pk=instance.pk)
    except Directory.DoesNotExist:
        pass  # Object is new.
    else:
        if not obj.drive.is_dss_drive:
            return
        # if the read write setting on the container is read-only raise an error here, as we won't allow deletion
        if obj.drive.envelope.container.read_write_setting == READ_ONLY:
            raise ValidationError({
                'drive': ValidationError(
                    _("It is not allowed to delete directories in read-only DSS containers"),
                    params={'drive': instance.drive},
                    code='invalid'
                )
            })


@receiver(pre_delete, sender=Drive)
def prevent_deleting_drive_in_read_only_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = Drive.objects.get(pk=instance.pk)
    except Drive.DoesNotExist:
        pass  # Object is new.
    else:
        if not obj.is_dss_drive:
            return
        # if the read write setting on the container is read-only raise an error here, as we won't allow deletion
        if obj.envelope.container.read_write_setting == READ_ONLY:
            raise ValidationError({
                'envelope': ValidationError(
                    _("It is not allowed to delete storages in read-only DSS containers"),
                    params={'envelope': instance.envelope},
                    code='invalid'
                )
            })


@receiver(pre_save, sender=Drive)
def prevent_moving_drive_out_of_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = Drive.objects.get(pk=instance.pk)
    except Drive.DoesNotExist:
        pass  # Object is new.
    else:
        # The Drive was a DSS Drive and the after saving it wouldn't be anymore -> not allowed
        if obj.is_dss_drive and not instance.is_dss_drive:
            raise ValidationError({
                'envelope': ValidationError(
                    _("You are not allowed to move this storage out of its DSS container"),
                    params={'envelope': instance.envelope},
                    code='invalid'
                )
            })
        # The Drive would be moved to a drive in another container -> not allowed
        if obj.is_dss_drive and instance.is_dss_drive:
            obj_container_pk = obj.envelope.container.pk
            instance_container_pk = instance.envelope.container.pk
            if not obj_container_pk == instance_container_pk:
                raise ValidationError({
                    'envelope': ValidationError(
                        _("You are not allowed to move this storage out of its DSS container and into "
                          "another container"),
                        params={'envelope': instance.envelope},
                        code='invalid'
                    )
                })


@receiver(pre_save, sender=File)
def check_new_files_for_dss_container_read_write_settings(sender, instance, *args, **kwargs):
    # if the instance to be saved is a normal file we don't need to check anything here
    if not instance.is_dss_file:
        return

    # from here we can be sure that the file to be saved is a dss file

    # lets get the container setting now
    container_rw_setting = instance.directory.drive.envelope.container.read_write_setting
    # if the read_write_all settings are active we do nothing here
    if container_rw_setting == READ_WRITE_ALL:
        return

    is_existent_file = File.objects.filter(pk=instance.pk).exists()
    if not is_existent_file and container_rw_setting == READ_ONLY:
        raise ContainerReadWriteException(READ_ONLY)
    if not is_existent_file and container_rw_setting == READ_WRITE_NO_NEW:
        raise ContainerReadWriteException(READ_WRITE_NO_NEW)


@receiver(pre_save, sender=File)
def prevent_moving_normal_files_into_read_only_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = File.objects.get(pk=instance.pk)
    except File.DoesNotExist:
        pass  # Object is new.
    else:
        # The File was not a DSS File and the after saving it would be -> not allowed
        if not obj.is_dss_file and instance.is_dss_file:
            container_rw_setting = instance.directory.drive.envelope.container.read_write_setting
            if container_rw_setting == READ_ONLY:
                raise ValidationError({
                    'directory_id': ValidationError(
                        _("You are not allowed to move this file into a read only DSS container"),
                        params={'directory_id': instance.directory_id},
                        code='invalid'
                    )
                })


@receiver(pre_save, sender=File)
def prevent_moving_normal_files_into_read_write_no_new_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = File.objects.get(pk=instance.pk)
    except File.DoesNotExist:
        pass  # Object is new.
    else:
        # The File was not a DSS File and the after saving it would be -> not allowed
        if not obj.is_dss_file and instance.is_dss_file:
            container_rw_setting = instance.directory.drive.envelope.container.read_write_setting
            if container_rw_setting == READ_WRITE_NO_NEW:
                raise ValidationError({
                    'directory_id': ValidationError(
                        _("You are not allowed to move this file into a read write no new DSS container"),
                        params={'directory_id': instance.directory_id},
                        code='invalid'
                    )
                })


@receiver(pre_save, sender=Drive)
def prevent_moving_normal_storage_into_read_only_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = Drive.objects.get(pk=instance.pk)
    except Drive.DoesNotExist:
        pass  # Object is new.
    else:
        # The Drive was not a DSS Drive and the after saving it would be -> not allowed
        if not obj.is_dss_drive and instance.is_dss_drive:
            container_rw_setting = instance.envelope.container.read_write_setting
            if container_rw_setting == READ_ONLY:
                raise ValidationError({
                    'envelope': ValidationError(
                        _("You are not allowed to move this storage into a read only DSS container"),
                        params={'envelope': instance.envelope},
                        code='invalid'
                    )
                })


@receiver(pre_save, sender=Drive)
def prevent_moving_normal_storage_into_read_write_no_new_dss_container(sender, instance, *args, **kwargs):
    try:
        obj = Drive.objects.get(pk=instance.pk)
    except Drive.DoesNotExist:
        pass  # Object is new.
    else:
        # The Drive was not a DSS Drive and the after saving it would be -> not allowed
        if not obj.is_dss_drive and instance.is_dss_drive:
            container_rw_setting = instance.envelope.container.read_write_setting
            if container_rw_setting == READ_WRITE_NO_NEW:
                raise ValidationError({
                    'envelope': ValidationError(
                        _("You are not allowed to move this storage into a read write no new DSS container"),
                        params={'envelope': instance.envelope},
                        code='invalid'
                    )
                })


@receiver(pre_save, sender=Drive)
def check_drive_is_not_in_read_only_or_read_write_no_new_container(instance, *args, **kwargs):
    # if the instance to be saved is a normal drive we don't need to check anything here
    if not instance.is_dss_drive:
        return

    # from here we can be sure that the drive to be saved is a dss drive

    # lets get the container setting now
    container_rw_setting = instance.envelope.container.read_write_setting
    # if the read_write_all settings are active we do nothing here
    if container_rw_setting == READ_WRITE_ALL:
        return

    is_existent_drive = Drive.objects.filter(pk=instance.pk).exists()
    if not is_existent_drive and container_rw_setting == READ_ONLY:
        raise ValidationError({
            'drive': ValidationError(
                _("The storage cannot be created because the DSS container of the envelope is read only."),
                params={'drive': instance.envelope},
                code='invalid'
            )}
        )
    if not is_existent_drive and container_rw_setting == READ_WRITE_NO_NEW:
        raise ValidationError({
            'drive': ValidationError(
                _("The storage cannot be created because the DSS container allows no new storages to be added."),
                params={'drive': instance.envelope},
                code='invalid'
            )}
        )


@receiver(pre_save, sender=Directory)
def check_directory_is_not_in_read_only_or_read_write_no_new_drive(instance, *args, **kwargs):
    """
    If the parent drive is in a read_only container the directory shouldn't be created
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    # we recursively look for the root directory here, which has no directory
    if instance.directory:
        check_directory_is_not_in_read_only_or_read_write_no_new_drive(instance.directory, args, kwargs)

    if not instance.drive:
        # no parent drive set, ignore
        return

    if not instance.drive.is_dss_drive:
        # not a DSS drive, ignore
        return

    if instance.drive.envelope.container.read_write_setting == READ_ONLY:
        raise ValidationError({
            'directory': ValidationError(
                _("The directory cannot be created because the DSS container of the storage is read only."),
                params={'directory': instance.directory},
                code='invalid'
            )}
        )

    if instance.drive.envelope.container.read_write_setting == READ_WRITE_NO_NEW:
        raise ValidationError({
            'directory': ValidationError(
                _("The directory cannot be created because the DSS container of the storage allows "
                  "no new directories."),
                params={'directory': instance.directory},
                code='invalid'
            )}
        )


@receiver(pre_save, sender=File)
def change_file_path_on_directory_change(sender, instance, *args, **kwargs):
    try:
        obj = File.objects.get(pk=instance.pk)
    except File.DoesNotExist:
        pass  # Object is new.
    else:
        # get the new dynamic upload paths
        instance_upload_path = get_upload_to_path(instance, instance.name)
        obj_upload_path = get_upload_to_path(obj, obj.name)
        if not instance_upload_path == obj_upload_path and obj.is_dss_file:
            try:
                # combine the storage location with the upload path to get the full path
                new_file_path = os.path.join(dss_storage.location, instance_upload_path)

                # create folder if it does not exist
                if not os.path.exists(os.path.dirname(new_file_path)):
                    os.makedirs(os.path.dirname(new_file_path))

                # rename old file path to the new file path
                # renaming cannot be done across devices, so a file cannot be renamed to a path outside the container
                # if moving between containers is needed at some
                # point shutil.copy() and os.remove() could be used instead-
                os.rename(instance.path.path, new_file_path)

                # now let's change the path field to the new upload path
                instance.path = instance_upload_path

                # the current uploaded file entry path also needs to be changed
                if instance.uploaded_file_entry:
                    uploaded_file_entry = UploadedFileEntry.objects.get(pk=instance.uploaded_file_entry.pk)
                    uploaded_file_entry.path = instance_upload_path
                    uploaded_file_entry.save()

                # lets close the file
                instance.path.file.close()

            except Exception as error:
                logger.error("ERROR in change_file_path_on_directory_change():", error)


@receiver(post_save, sender=Drive)
def change_file_paths_on_drive_change(sender, instance, *args, **kwargs):
    try:
        obj = Drive.objects.get(pk=instance.pk)
    except Drive.DoesNotExist:
        pass  # Object is new.
    else:
        if obj.is_dss_drive:
            files = File.objects.filter(directory__drive=obj)

            for file in files:
                # get the new dynamic upload path, this will be stored in the DB
                instance_upload_path = get_upload_to_path(file, file.name)
                try:
                    # combine the storage location with the upload path to get the full path
                    new_file_path = os.path.join(dss_storage.location, instance_upload_path)

                    # create folder if it does not exist
                    if not os.path.exists(os.path.dirname(new_file_path)):
                        os.makedirs(os.path.dirname(new_file_path))

                    # rename old file path to the new file path
                    # renaming cannot be done across devices, so a file cannot be renamed to a path
                    # outside the container
                    # if moving between containers is needed at some
                    # point shutil.copy() and os.remove() could be used instead-
                    os.rename(file.path.path, new_file_path)

                    # now let's change the path field to the new upload path
                    file.path = instance_upload_path
                    file.save()

                    # the current uploaded file entry path also needs to be changed
                    uploaded_file_entry = UploadedFileEntry.objects.get(pk=file.uploaded_file_entry.pk)
                    uploaded_file_entry.path = instance_upload_path
                    uploaded_file_entry.save()

                    # lets close the file
                    file.path.file.close()

                except Exception as error:
                    logger.error("ERROR in change_file_path_on_directory_change():", error)


@receiver(post_save, sender=DSSEnvelope)
def change_file_paths_on_envelope_change(sender, instance, *args, **kwargs):
    try:
        obj = DSSEnvelope.objects.get(pk=instance.pk)
    except DSSEnvelope.DoesNotExist:
        pass  # Object is new.
    else:
        if not obj.path == instance.path:
            files = File.objects.filter(directory__drive__envelope=obj.path)

            for file in files:
                # get the new dynamic upload path, this will be stored in the DB
                instance_upload_path = get_upload_to_path(file, file.name)
                try:
                    # combine the storage location with the upload path to get the full path
                    new_file_path = os.path.join(dss_storage.location, instance_upload_path)

                    # create folder if it does not exist
                    if not os.path.exists(os.path.dirname(new_file_path)):
                        os.makedirs(os.path.dirname(new_file_path))

                    # rename old file path to the new file path
                    # renaming cannot be done across devices, so a file cannot be renamed to a path
                    # outside the container
                    # if moving between containers is needed at some
                    # point shutil.copy() and os.remove() could be used instead-
                    os.rename(file.path.path, new_file_path)

                    # now let's change the path field to the new upload path
                    file.path = instance_upload_path
                    file.save()

                    # the current uploaded file entry path also needs to be changed
                    uploaded_file_entry = UploadedFileEntry.objects.get(pk=file.uploaded_file_entry.pk)
                    uploaded_file_entry.path = instance_upload_path
                    uploaded_file_entry.save()

                    # lets close the file
                    file.path.file.close()

                except Exception as error:
                    logger.error("ERROR in change_file_paths_on_envelope_change():", error)


@receiver(pre_save, sender=ModelPrivilege)
def disallow_change_of_dss_curator_privilege(instance, *args, **kwargs):
    """
    Validates that a model privilege can only be edited if it is not of the DSS curator
    :return:
    """
    existing_model_privilege = ModelPrivilege.objects.filter(pk=instance.pk).first()

    # check if the instance already exists
    if not existing_model_privilege:
        return

    if existing_model_privilege.full_access_privilege != ModelPrivilege.ALLOW:
        return

    # the user of the ModelPrivilege is not a DSS Curator --> OK
    if not instance.user.groups.filter(name="DSS Curator").exists():
        return

    content_type = instance.content_object.get_content_type()

    # we only want this handler for DSS related elements
    if content_type.model not in ['file', 'drive', 'dsscontainer']:
        return

    # ModelPrivilege.user is not the DSS Curator of the DSS File the ModelPrivilege should be deleted for --> OK
    if content_type and content_type.model == 'file' and \
            not instance.content_object.directory.drive.envelope.container.created_by == instance.user:
        return

    # ModelPrivilege.user is not the DSS Curator of the DSS Drive the ModelPrivilege should be deleted for --> OK
    if content_type and content_type.model == 'drive' and \
            not instance.content_object.envelope.container.created_by == instance.user:
        return

    # ModelPrivilege.user is not the DSS Curator of the DSS Container the ModelPrivilege should be deleted for --> OK
    if content_type and content_type.model == 'dsscontainer' and \
            not instance.created_by == instance.user:
        return

    # else: we are trying to edit a dss curator privilege -> not allowed
    raise ValidationError({
        'full_access_privilege': ValidationError(
            _("The full_access_privilege of the DSS Curator cannot be edited"),
            params={'full_access_privilege': instance.full_access_privilege},
            code='invalid'
        )
    })


@receiver(post_delete, sender=ModelPrivilege)
def disallow_delete_of_dss_curator_privilege(instance, *args, **kwargs):
    """
    Validates that a model privilege can only be deleted if it is not of the DSS curator
    :return:
    """
    content_object = instance.content_object

    if not content_object:
        return

    content_type = content_object.get_content_type()

    # we only want this handler for DSS related elements
    if content_type.model not in ['file', 'drive', 'dsscontainer']:
        return

    # allow deleting model privilege if the underlying content object has already been soft deleted
    if hasattr(content_object, 'deleted') and content_object.deleted:
        return

    if instance.full_access_privilege != ModelPrivilege.ALLOW:
        return

    # the user of the ModelPrivilege is not a DSS Curator --> OK
    if not instance.user.groups.filter(name="DSS Curator").exists():
        return

    # ModelPrivilege.user is not the DSS Curator of the DSS File the ModelPrivilege should be deleted for --> OK
    if content_type and content_type.model == 'file' and \
            not content_object.directory.drive.envelope.container.created_by == instance.user:
        return

    # ModelPrivilege.user is not the DSS Curator of the DSS Drive the ModelPrivilege should be deleted for --> OK
    if content_type and content_type.model == 'drive' and \
            not content_object.envelope.container.created_by == instance.user:
        return

    # ModelPrivilege.user is not the DSS Curator of the DSS Container the ModelPrivilege should be deleted for --> OK
    if content_type and content_type.model == 'dsscontainer' and \
            not instance.created_by == instance.user:
        return

    # else: we are trying to delete a dss curator privilege -> not allowed
    raise ValidationError({
        'full_access_privilege': ValidationError(
            _("The full_access_privilege of the DSS Curator cannot be deleted"),
            params={'full_access_privilege': instance.full_access_privilege},
            code='invalid'
        )
    })
