# -*- coding: utf-8 -*-
# Generated by Django 1.11.29 on 2020-04-14 12:31
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0097_booking_integration_in_appointments'),
    ]

    operations = [
        migrations.AddField(
            model_name='resource',
            name='branch_library',
            field=models.CharField(blank=True, choices=[('CHEM', 'Chemistry'), ('MAIT', 'Mathematics & Informatics'), ('MEDIC', 'Medicine'), ('PHY', 'Physics'), ('SHSCI', 'Sport & Health Sciences'), ('MCAMP', 'Main Campus'), ('WEIH', 'Weihenstephan')], max_length=5, verbose_name='Branch Library of Study Room'),
        ),
        migrations.AddField(
            model_name='resource',
            name='study_room',
            field=models.BooleanField(default=False, verbose_name='Study Room'),
        ),
    ]
