# Generated by Django 2.2.12 on 2020-04-30 11:07

import django_cleanhtmlfield.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0023_migrate_view_permissions'),
    ]

    operations = [
        migrations.AddField(
            model_name='contact',
            name='notes',
            field=django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='Notes about the contact'),
        ),
    ]
