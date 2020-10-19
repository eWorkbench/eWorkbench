#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django import template
from django.conf import settings

from eric.site_preferences.models import options as site_preferences_object

register = template.Library()


@register.simple_tag
def site_preferences(key):
    """ Provides access to site settings. """
    return getattr(site_preferences_object, key)


@register.simple_tag
def site_url():
    return settings.WORKBENCH_SETTINGS['url']
