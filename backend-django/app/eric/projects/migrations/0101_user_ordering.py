# Generated by Django 2.2.15 on 2020-09-28 16:45

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0100_add_indexes'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='myuser',
            options={'ordering': ('userprofile__last_name', 'userprofile__first_name', 'email', 'username')},
        ),
    ]
