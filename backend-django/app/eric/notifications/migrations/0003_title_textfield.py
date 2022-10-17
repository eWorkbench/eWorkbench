#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0002_changeset'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='title',
            field=models.TextField(verbose_name='Title of the notification'),
        ),
    ]
