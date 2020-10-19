#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import os

from django.db.models.signals import post_delete
from django.dispatch import receiver

from eric.plugins.models.models import PluginInstance

LOGGER = logging.getLogger(__name__)


def try_delete_file(file):
    if file and os.path.isfile(file.path):
        try:
            os.remove(file.path)
        except OSError:
            LOGGER.exception("Could not delete file {}".format(file))


@receiver(post_delete, sender=PluginInstance)
def auto_delete_plugin_instance_files_on_delete(sender, instance, **kwargs):
    try_delete_file(instance.rawdata)
    try_delete_file(instance.picture)

    for cs in instance.changesets.all():
        for cr in cs.change_records.filter(field_name__in=['rawdata', 'picture']):
            try_delete_file(cr.old_value)
