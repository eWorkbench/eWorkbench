# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models

TARGET_APP = 'django_changeset'

class Migration(migrations.Migration):
    dependencies = [
        ('django_changeset', '0002_add_index_changesettype'),
        ('projects', '0043_flat_architecture')
    ]

# empty migration on purpose!