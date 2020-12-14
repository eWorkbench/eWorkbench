# Generated by Django 2.2.17 on 2020-11-19 09:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dss', '0002_add_dss_curator_group_and_permissions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dssfilestoimport',
            name='imported_at',
            field=models.DateTimeField(blank=True, db_index=True, editable=False, null=True, verbose_name='Date when this element was imported'),
        ),
        migrations.AlterField(
            model_name='dssfilestoimport',
            name='last_import_attempt_failed_at',
            field=models.DateTimeField(blank=True, db_index=True, editable=False, null=True, verbose_name='Date of the last failed import attempt of the File to import'),
        ),
    ]