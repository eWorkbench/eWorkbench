# Generated by Django 2.2.27 on 2022-03-01 08:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0109_resourcebookingrulebookablehours_remove_weekday_fields'),
    ]

    operations = [
        migrations.RenameField(
            model_name='resource',
            old_name='user_availability_selected_user_groups',
            new_name='usage_setting_selected_user_groups',
        ),
        migrations.RemoveField(
            model_name='resource',
            name='user_availability_selected_users',
        ),
        migrations.RenameField(
            model_name='resource',
            old_name='user_availability',
            new_name='general_usage_setting',
        ),
    ]
