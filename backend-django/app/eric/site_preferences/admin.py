#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin

from django.contrib import admin

admin.site.index_template = 'admin/my_custom_index.html'
admin.autodiscover()
