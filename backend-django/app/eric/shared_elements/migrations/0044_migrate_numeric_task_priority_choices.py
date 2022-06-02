from django.db import migrations
from django_changeset.models import RevisionModelMixin

from eric.core.models import DisableSignals
from eric.shared_elements.models.models import Task


OLD_TASK_PRIORITY_VERY_HIGH = "VHIGH"
OLD_TASK_PRIORITY_HIGH = "HIGH"
OLD_TASK_PRIORITY_NORMAL = "NORM"
OLD_TASK_PRIORITY_LOW = "LOW"
OLD_TASK_PRIORITY_VERY_LOW = "VLOW"


def migrate_task_priority_choices_forward(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias
    # Task = apps.get_model('shared_elements', 'Task')

    with DisableSignals():  # avoid permission/lock checks
        Task.objects.using(db_alias).filter(priority=OLD_TASK_PRIORITY_VERY_HIGH).update(
            priority=Task.TASK_PRIORITY_VERY_HIGH)

        Task.objects.using(db_alias).filter(priority=OLD_TASK_PRIORITY_HIGH).update(
            priority=Task.TASK_PRIORITY_HIGH)

        Task.objects.using(db_alias).filter(priority=OLD_TASK_PRIORITY_NORMAL).update(
            priority=Task.TASK_PRIORITY_NORMAL)

        Task.objects.using(db_alias).filter(priority=OLD_TASK_PRIORITY_LOW).update(
            priority=Task.TASK_PRIORITY_LOW)

        Task.objects.using(db_alias).filter(priority=OLD_TASK_PRIORITY_VERY_LOW).update(
            priority=Task.TASK_PRIORITY_VERY_LOW)

    RevisionModelMixin.set_enabled(True)


def migrate_task_priority_choices_backward(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)

    db_alias = schema_editor.connection.alias
    # Task = apps.get_model('shared_elements', 'Task')

    with DisableSignals():  # avoid permission/lock checks
        Task.objects.using(db_alias).filter(priority=Task.TASK_PRIORITY_VERY_HIGH).update(
            priority=OLD_TASK_PRIORITY_VERY_HIGH)

        Task.objects.using(db_alias).filter(priority=Task.TASK_PRIORITY_HIGH).update(
            priority=OLD_TASK_PRIORITY_HIGH)

        Task.objects.using(db_alias).filter(priority=Task.TASK_PRIORITY_NORMAL).update(
            priority=OLD_TASK_PRIORITY_NORMAL)

        Task.objects.using(db_alias).filter(priority=Task.TASK_PRIORITY_LOW).update(
            priority=OLD_TASK_PRIORITY_LOW)

        Task.objects.using(db_alias).filter(priority=Task.TASK_PRIORITY_VERY_LOW).update(
            priority=OLD_TASK_PRIORITY_VERY_LOW)

    RevisionModelMixin.set_enabled(True)


class Migration(migrations.Migration):
    dependencies = [
        ('shared_elements', '0043_numeric_task_priority_choices'),
    ]

    operations = [
        migrations.RunPython(
            migrate_task_priority_choices_forward,
            migrate_task_priority_choices_backward
        ),
    ]
