#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os

from django.conf import settings
from django.contrib.contenttypes.models import ContentType

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from eric.site_preferences.models import options


class ListSitePreferences(APIView):
    """
    View to list all site preferences (read only)
    """

    authentication_classes = ()
    permission_classes = (permissions.AllowAny,)

    def get(self, request, format=None):
        """
        Return a list of all site preferences (stored in global_preferences_registry).
        """
        data = {
            "site_name": options.site_name,
            "site_logo": request.build_absolute_uri(os.path.join(settings.MEDIA_URL, options.site_logo)),
            "navbar_background_color": options.navbar_background_color,
            "navbar_border_color": options.navbar_border_color,
            "content_types": {f"{ct.app_label}.{ct.model}": ct.pk for ct in ContentType.objects.all()},
        }

        return Response(data)
