# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, transaction
from django.db.migrations import RunPython


@transaction.atomic
def remove_text_template_admin(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.filter(name="Text Template Admin").delete()


class Migration(migrations.Migration):
    dependencies = [
        ('integration', '0002_update_roles_for_resources'),
    ]

    operations = [
        RunPython(
            remove_text_template_admin,
            RunPython.noop  # no undo possible
        )
    ]
