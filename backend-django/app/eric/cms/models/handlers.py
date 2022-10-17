#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import logging
from datetime import timedelta

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from django_rest_multitokenauth.models import MultiToken

from eric.cms.models import LaunchScreen
from eric.core.tests import custom_json_handler
from eric.versions.models import Version

logger = logging.getLogger(__name__)


@receiver(post_save, sender=LaunchScreen)
def logout_all_users(instance, created, *args, **kwargs):
    if instance.show_screen:
        MultiToken.objects.all().delete()


def handle_version_on_launch_screen_updates(old_launch_screen):
    """
    Actually creates the Version using the old_launch_screen data
    :param old_launch_screen:
    :return:
    """
    try:
        now = timezone.now()
        now_delta = now - timedelta(seconds=2)
        object_id = old_launch_screen.pk
        metadata = old_launch_screen.export_metadata()
        metadata = json.loads(json.dumps(metadata, default=custom_json_handler))
        content_type = old_launch_screen.get_content_type()
        summary = _("LaunchScreen updated: {} (auto-generated)").format(old_launch_screen.title)
        same_version = Version.objects.filter(
            object_id=object_id,
            created_at__gte=now_delta,
            content_type=content_type,
        ).exists()
        if not same_version:
            Version.objects.create(content_type=content_type, object_id=object_id, metadata=metadata, summary=summary)
    except Exception as error:
        logger.error(f"ERROR: Error in handle_version_on_launch_screen_updates: {error}")


@receiver(pre_save, sender=LaunchScreen)
def create_version_on_launch_screen_updates(sender, instance, *args, **kwargs):
    """
    Before saving a LaunchScreen, create a version using the old data.
    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    try:
        old_launch_screen = LaunchScreen.objects.get(pk=instance.pk)
    except LaunchScreen.DoesNotExist:
        pass  # Object is new.
    else:
        handle_version_on_launch_screen_updates(old_launch_screen)
