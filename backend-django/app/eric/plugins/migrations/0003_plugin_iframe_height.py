# Generated by Django 2.2.27 on 2022-03-09 11:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plugins', '0002_fix_user_fk'),
    ]

    operations = [
        migrations.AddField(
            model_name='plugin',
            name='iframe_height',
            field=models.IntegerField(default=250, verbose_name='Height of the iframe element in pixel'),
        ),
    ]