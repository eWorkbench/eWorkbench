# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('model_privileges', '0006_changesets'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='modelprivilege',
            unique_together=set([('user', 'content_type', 'object_id')]),
        ),
    ]
