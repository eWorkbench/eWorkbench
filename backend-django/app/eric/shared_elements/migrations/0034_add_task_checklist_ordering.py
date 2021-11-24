# Generated by Django 2.2.20 on 2021-08-13 07:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shared_elements', '0033_meeting_task_full_day_data_migration'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='taskchecklist',
            options={
                'ordering': ['task__task_id', 'ordering', 'created_at'],
                'verbose_name': 'Task Checklist Item', 'verbose_name_plural': 'Task Checklist Items'
            },
        ),
        migrations.AddField(
            model_name='taskchecklist',
            name='ordering',
            field=models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering'),
        ),
    ]