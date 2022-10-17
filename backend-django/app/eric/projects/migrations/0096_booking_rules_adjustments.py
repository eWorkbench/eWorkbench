# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0095_remove_resource_inventory_number'),
    ]

    operations = [
        migrations.CreateModel(
            name='ResourceBookingRuleMaximumTimeBefore',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('duration', models.DurationField(verbose_name='The maximum time before a resource booking')),
                ('resource', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='booking_rule_maximum_time_before', to='projects.Resource', verbose_name='Booked resource')),
            ],
            options={
                'verbose_name': 'Resource booking rule maximum time before',
                'verbose_name_plural': 'Resource booking rules maximum time before',
            },
        ),
        migrations.CreateModel(
            name='ResourceBookingRuleMinimumTimeBefore',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('duration', models.DurationField(verbose_name='The minimum time before a resource booking')),
                ('resource', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='booking_rule_minimum_time_before', to='projects.Resource', verbose_name='Booked resource')),
            ],
            options={
                'verbose_name': 'Resource booking rule minimum time before',
                'verbose_name_plural': 'Resource booking rules minimum time before',
            },
        ),
        migrations.RemoveField(
            model_name='resourcebookingruletimebefore',
            name='resource',
        ),
        migrations.RemoveField(
            model_name='resourcebookingrulebookingsperuser',
            name='total',
        ),
        migrations.DeleteModel(
            name='ResourceBookingRuleTimeBefore',
        ),
    ]
