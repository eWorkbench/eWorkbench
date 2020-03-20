# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations
from django.contrib.postgres.operations import TrigramExtension, UnaccentExtension


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0024_fts'),
        ('dmp', '0009_fts'),
    ]

    operations = [
        TrigramExtension(),
        UnaccentExtension(),
    ]
