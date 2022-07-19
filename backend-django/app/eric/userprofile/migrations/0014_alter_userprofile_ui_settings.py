# Generated by Django 3.2.8 on 2021-11-05 12:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprofile', '0013_confirmation_dialog_settings_cleanup'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='ui_settings',
            field=models.JSONField(blank=True, null=True, verbose_name='Persistent UI settings that have no effect on the backend'),
        ),
    ]
