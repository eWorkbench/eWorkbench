#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db.models import Model

from django_changeset.models import RevisionModelMixin
from PIL import Image

from eric.core.models import disable_permission_checks
from eric.shared_elements.models import File, UploadedFileEntry

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
    help = "migrate files and file entries to correct relative paths"

    def handle(self, *args, **options):
        # monkey patch File save method
        File.save = Model.save

        with RevisionModelMixin.enabled(False):
            with disable_permission_checks(File):
                with disable_permission_checks(UploadedFileEntry):
                    # get all files
                    files = File.objects.all().prefetch_related("file_entries")

                    # and iterate over them
                    for file in files:
                        file.path = convert_absolute_path_to_relative_path_of_media_root(file.path.path)
                        file.save()

                        # check if the file has a file entries
                        file_entries = file.file_entries.all()

                        for entry in file_entries:
                            entry.path = convert_absolute_path_to_relative_path_of_media_root(entry.path.path)
                            entry.save()
