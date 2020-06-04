#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db.models import Model
from django_changeset.models import RevisionModelMixin

from eric.core.models import disable_permission_checks
from eric.pictures.models import Picture, UploadedPictureEntry

User = get_user_model()


def convert_absolute_path_to_relative_path_of_media_root(path):
    if os.path.isabs(path):
        return os.path.relpath(path, settings.MEDIA_ROOT)
    else:
        return path


def get_file_size(path):
    st = os.stat(path)
    return st.st_size


class Command(BaseCommand):
    help = 'migrate pictures with changesets to pictures with uploaded picture entries'

    def handle(self, *args, **options):
        # monkey patch pictures save method
        Picture.save = Model.save

        with RevisionModelMixin.enabled(False):
            with disable_permission_checks(Picture):
                with disable_permission_checks(UploadedPictureEntry):
                    # get all pictures
                    pictures = Picture.objects.all().prefetch_related('picture_entries')

                    # and iterate over them
                    for picture in pictures:
                        # fill background_image_size, rendered_image_size and shapes_image_size
                        # also validate the path, if it is an absolute path, convert it to a relative path
                        # (using MEDIA_ROOT)
                        if picture.rendered_image:
                            picture.rendered_image_size = picture.rendered_image.size
                            picture.rendered_image = convert_absolute_path_to_relative_path_of_media_root(
                                picture.rendered_image.path
                            )

                        if picture.background_image:
                            picture.background_image_size = picture.background_image.size
                            picture.background_image = convert_absolute_path_to_relative_path_of_media_root(
                                picture.background_image.path
                            )

                        if picture.shapes_image:
                            picture.shapes_image_size = picture.shapes_image.size
                            picture.shapes_image = convert_absolute_path_to_relative_path_of_media_root(
                                picture.shapes_image.path
                            )

                        picture.save()

                        # check if the picture has a uploaded picture entry
                        uploaded_picture_entries = picture.picture_entries.all()

                        if len(uploaded_picture_entries) == 0:
                            print("Creating uploaded picture entries for picture with pk={}".format(picture.pk))

                            # get changesets of this picture
                            for cs in picture.changesets.all():
                                # get all change records for this picture, which contain either
                                # - background_image
                                # - rendered_image
                                # - shapes_image
                                change_records = cs.change_records.filter(
                                    field_name__in=[
                                        'background_image', 'rendered_image', 'shapes_image', 'width', 'height'
                                    ]
                                )

                                entry = UploadedPictureEntry(
                                    picture=picture,
                                    created_by=cs.user,
                                    created_at=cs.date,
                                    last_modified_at=cs.date,
                                    last_modified_by=cs.user,
                                    background_image=None,
                                    rendered_image=None,
                                    shapes_image=None
                                )

                                for cr in change_records:
                                    if cr.field_name in ['background_image', 'rendered_image', 'shapes_image'] and \
                                            cr.new_value and cr.new_value != '':
                                        if not os.path.isabs(cr.new_value):
                                            value = os.path.join(settings.MEDIA_ROOT, cr.new_value)
                                        else:
                                            value = cr.new_value

                                        # set size
                                        setattr(entry, cr.field_name + "_size", get_file_size(value))

                                        # convert value to relative path
                                        value = convert_absolute_path_to_relative_path_of_media_root(value)
                                        # set path
                                        setattr(entry, cr.field_name, value)

                                        print("Setting {} to {}".format(cr.field_name, cr.new_value))

                                    elif cr.field_name in ['width', 'height']:
                                        print("Setting {} to {}".format(cr.field_name, cr.new_value))
                                        setattr(entry, cr.field_name, cr.new_value)

                                entry.save()
