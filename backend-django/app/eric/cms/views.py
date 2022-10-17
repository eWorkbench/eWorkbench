#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.views.generic import DetailView

from eric.cms.models import Content


class ContentView(DetailView):
    model = Content
    template_name = "cms/base.html"
