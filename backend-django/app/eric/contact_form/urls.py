#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
"""URL Configuration for contact form"""

from django.urls import re_path

from eric.contact_form.views import send_contact_form

urlpatterns = [
    re_path(r'^contact_form', send_contact_form)
]
