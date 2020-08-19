# Generated by Django 2.2.14 on 2020-07-31 08:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('metadata', '0006_migrate_view_permissions'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='metadata',
            options={'ordering': ['entity_id', 'ordering', 'created_at']},
        ),
        migrations.AddField(
            model_name='metadata',
            name='ordering',
            field=models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering'),
        ),
    ]