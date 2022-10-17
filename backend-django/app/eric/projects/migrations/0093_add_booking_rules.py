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
        ('projects', '0092_resource_update_user_availability_choice_text'),
    ]

    operations = [
        migrations.CreateModel(
            name='ResourceBookingRuleBookableHours',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('monday', models.BooleanField(default=False, verbose_name='Monday')),
                ('tuesday', models.BooleanField(default=False, verbose_name='Tuesday')),
                ('wednesday', models.BooleanField(default=False, verbose_name='Wednesday')),
                ('thursday', models.BooleanField(default=False, verbose_name='Thursday')),
                ('friday', models.BooleanField(default=False, verbose_name='Friday')),
                ('saturday', models.BooleanField(default=False, verbose_name='Saturday')),
                ('sunday', models.BooleanField(default=False, verbose_name='Sunday')),
                ('time_start', models.TimeField(verbose_name='Time start')),
                ('time_end', models.TimeField(verbose_name='Time end')),
                ('resource', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='booking_rule_bookable_hours', to='projects.Resource', verbose_name='Booked resource')),
            ],
            options={
                'verbose_name_plural': 'Resource booking rules bookable hours',
                'verbose_name': 'Resource booking rule bookable hours',
            },
        ),
        migrations.CreateModel(
            name='ResourceBookingRuleBookingsPerUser',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('count', models.IntegerField(verbose_name='The number of times a user can book a resource')),
                ('unit', models.CharField(choices=[('DAY', 'Day'), ('WEEK', 'Week'), ('MONTH', 'Month')], default='DAY', max_length=5)),
                ('total', models.BooleanField(default=False, verbose_name='Account for the total (true) or only the open/future (false) bookings')),
                ('resource', models.ForeignKey(blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='booking_rule_bookings_per_user', to='projects.Resource', verbose_name='Booking rules for bookings_per_user')),
            ],
            options={
                'verbose_name_plural': 'Resource booking rules bookings per user',
                'verbose_name': 'Resource booking rule bookings per user',
            },
        ),
        migrations.CreateModel(
            name='ResourceBookingRuleMaximumDuration',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('duration', models.DurationField(verbose_name='The maximum duration of a resource booking')),
                ('resource', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='booking_rule_maximum_duration', to='projects.Resource', verbose_name='Booked resource')),
            ],
            options={
                'verbose_name_plural': 'Resource booking rules maximum duration',
                'verbose_name': 'Resource booking rule maximum duration',
            },
        ),
        migrations.CreateModel(
            name='ResourceBookingRuleMinimumDuration',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('duration', models.DurationField(verbose_name='The minimum duration of a resource booking')),
                ('resource', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='booking_rule_minimum_duration', to='projects.Resource', verbose_name='Booked resource')),
            ],
            options={
                'verbose_name_plural': 'Resource booking rules minimum duration',
                'verbose_name': 'Resource booking rule minimum duration',
            },
        ),
        migrations.CreateModel(
            name='ResourceBookingRuleTimeBefore',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('duration', models.DurationField(verbose_name='The minimum time before a resource booking')),
                ('resource', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='booking_rule_time_before', to='projects.Resource', verbose_name='Booked resource')),
            ],
            options={
                'verbose_name_plural': 'Resource booking rules time before',
                'verbose_name': 'Resource booking rule time before',
            },
        ),
        migrations.CreateModel(
            name='ResourceBookingRuleTimeBetween',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('duration', models.DurationField(verbose_name='The minimum time between a resource booking')),
                ('resource', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='booking_rule_time_between', to='projects.Resource', verbose_name='Booked resource')),
            ],
            options={
                'verbose_name_plural': 'Resource booking rules time between',
                'verbose_name': 'Resource booking rule time between',
            },
        ),
    ]
