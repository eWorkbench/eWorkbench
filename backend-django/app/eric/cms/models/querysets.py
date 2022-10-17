#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import F

from django_userforeignkey.request import get_current_request, get_current_user

from eric.core.models import BaseQuerySet


class LaunchScreenQuerySet(BaseQuerySet):
    def viewable(self, *args, **kwargs):
        from eric.cms.models import AcceptedScreen

        user = get_current_user()

        if user.is_anonymous:
            return self.none()

        return self.filter(show_screen=True,).exclude(
            acceptedscreen__in=AcceptedScreen.objects.filter(
                created_by_id=user.pk,
                accepted_version=F("launch_screen__version"),
                accepted_timestamp=F("launch_screen__last_modified_at"),
            ),
        )
