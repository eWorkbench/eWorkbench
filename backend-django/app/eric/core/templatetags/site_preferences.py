#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django import template
from django.conf import settings
from django.urls import reverse

from eric.site_preferences.models import options as site_preferences_object

register = template.Library()


@register.simple_tag
def site_preferences(key):
    """Provides access to site settings."""
    return getattr(site_preferences_object, key)


@register.simple_tag
def site_url():
    return settings.WORKBENCH_SETTINGS["url"]


@register.simple_tag
def absolute_site_url(route_name, *args):
    """
    Get's the absolute URL for a route without a request.
    Example usage: {% absolute_site_url 'admin:db_logging_dblog_change' log.pk %}
    """

    base_url = site_url()
    route_url = reverse(route_name, args=args)
    return f"{base_url}{route_url}".replace("//", "/")
