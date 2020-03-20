#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.cache import cache
from django.db.models.signals import post_save
from django.dispatch import receiver

from eric.user_manual import PLACEHOLDER_CACHE_KEY, HELP_TEXT_CACHE_KEY
from eric.user_manual.models import UserManualPlaceholder, UserManualHelpText, UserManualCategory


def invalidate_help_text_cache_for_all_entries():
    categories = UserManualCategory.objects.all()

    for cat in categories:
        cache_key = HELP_TEXT_CACHE_KEY % cat.pk
        cache.set(cache_key, None)


@receiver(post_save, sender=UserManualPlaceholder)
def clear_placeholder_cache(*args, **kwargs):
    cache.set(PLACEHOLDER_CACHE_KEY, None)
    invalidate_help_text_cache_for_all_entries()


@receiver(post_save, sender=UserManualCategory)
def clear_help_text_cache_when_category_changed(*args, **kwargs):
    invalidate_help_text_cache_for_all_entries()


@receiver(post_save, sender=UserManualHelpText)
def clear_help_text_cache_when_help_text_changed(*args, **kwargs):
    invalidate_help_text_cache_for_all_entries()
