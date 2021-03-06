# Generated by Django 2.2.11 on 2020-03-19 13:03

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('labbooks', '0010_sections_add_fts'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='labbooksection',
            options={'ordering': ['date', 'title'], 'permissions': (
            ('trash_labbooksection', 'Can trash a LabBook section'),
            ('restore_labbooksection', 'Can restore a LabBook section'),
            ('change_project_labbooksection', 'Can change the project of a LabBook section'),
            ('add_labbooksection_without_project', 'Can add a LabBook section without a project')),
                     'verbose_name': 'LabbookSection', 'verbose_name_plural': 'LabbookSections'},
        ),
        migrations.AlterModelOptions(
            name='labbook',
            options={'permissions': (
                ('trash_labbook', 'Can trash a labbook'), ('restore_labbook', 'Can restore a labbook'),
                ('change_project_labbook', 'Can change the project of a labbook'),
                ('add_labbook_without_project', 'Can add a labbook without a project')), 'verbose_name': 'LabBook',
                'verbose_name_plural': 'LabBooks'},
        ),
    ]
