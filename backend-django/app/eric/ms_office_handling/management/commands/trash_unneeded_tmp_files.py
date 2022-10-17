#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import operator
from datetime import timedelta
from functools import reduce

from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from eric.core.models import DisableSignals
from eric.ms_office_handling.models.handlers import MS_OFFICE_EXTENSIONS, OFFICE_TEMP_FILE_PREFIX
from eric.shared_elements.models import File

logger = logging.getLogger("eric.ms_office_handling.models.handlers")


class Command(BaseCommand):
    help = "Trashes unneeded temp files that were created by editing files in webdav using MS Office"

    def handle(self, *args, **options):
        now = timezone.now()
        # get all files where title, name and original_filename start wit "~$", which are MS Office temp files
        unneeded_tmp_files = File.objects.all().filter(
            title__startswith=OFFICE_TEMP_FILE_PREFIX,
            name__startswith=OFFICE_TEMP_FILE_PREFIX,
            original_filename__startswith=OFFICE_TEMP_FILE_PREFIX,
            last_modified_at__lte=now - timedelta(seconds=60),
            deleted=False,
            imported=False,
        )
        # get a list of Q queries with all extensions, that can later be used in filters.
        clauses = (Q(original_filename__endswith=extension) for extension in MS_OFFICE_EXTENSIONS)
        extension_query = reduce(operator.or_, clauses)
        # filter the file list, that only files with MS Office extensions remain
        unneeded_tmp_files = unneeded_tmp_files.filter(extension_query)
        # now loop over the files and sanity check that there exists a file without the temp file prefix as well
        # if the check is successful then the unneeded_tmp_file is trashed (deleted=True)
        for unneeded_tmp_file in unneeded_tmp_files:
            proper_file_exists = File.objects.filter(
                name=unneeded_tmp_file.name[2:],
                deleted=False,
                imported=False,
            ).exists()
            if proper_file_exists:
                logger.info(f"Command trash_unneeded_tmp_files: Trashing {unneeded_tmp_file.name}")
                # with disable_permission_checks(File):
                with DisableSignals():
                    try:
                        unneeded_tmp_file.trash()
                    except FileNotFoundError:
                        unneeded_tmp_file.delete()
