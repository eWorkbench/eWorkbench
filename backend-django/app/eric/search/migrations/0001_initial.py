# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.contrib.postgres.operations import TrigramExtension, UnaccentExtension
from django.db import migrations


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
