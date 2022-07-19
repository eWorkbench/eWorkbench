#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import F
from django.http import Http404
from django.views import View
from django.http import HttpResponseRedirect
from django.utils import timezone

from eric.short_url.models.models import ShortURL


class RedirectView(View):
    """
    A very simple view that redirects for our short url service
    """
    def get(self, request, *args, **kwargs):
        try:
            short_url = ShortURL.objects.get(pk=kwargs['pk'])
        except Exception:
            raise Http404('not found')

        # the following line is equivalent to short_url.access_count += 1 , but this way it is not a race condition
        ShortURL.objects.filter(pk=kwargs['pk']).update(
            access_count=F('access_count') + 1, last_accessed=timezone.now()
        )

        return HttpResponseRedirect(short_url.url)
