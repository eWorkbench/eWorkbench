# Generated by Django 2.2.9 on 2019-12-19 10:28

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pictures', '0008_reference_archived_picture'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='picture',
            options={'ordering': ['title'], 'permissions': (('trash_picture', 'Can trash a picture'), ('restore_picture', 'Can restore a picture'), ('change_project_picture', 'Can change the project of a picture'), ('add_picture_without_project', 'Can add a picture without a project')), 'verbose_name': 'Picture', 'verbose_name_plural': 'Pictures'},
        ),
    ]
