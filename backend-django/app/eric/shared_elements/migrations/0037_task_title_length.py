# Generated by Django 2.2.20 on 2021-09-17 10:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0036_note_title_length'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='title',
            field=models.TextField(verbose_name='Title of the task'),
        ),
    ]