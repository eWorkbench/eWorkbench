# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import django.db.models.manager
import django_changeset.models.mixins
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('projects', '0011_added_project_state_deleted'),
    ]

    operations = [
        migrations.CreateModel(
            name='Dmp',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='title of the dmp')),
                ('status', models.CharField(choices=[('NEW', 'New'), ('PROG', 'In Progress'), ('FIN', 'Final')], default='NEW', max_length=5, verbose_name='Status of the Dmp')),
            ],
            options={
                'verbose_name_plural': 'DMPs',
                'permissions': (('view_dmp', 'Can view a dmp of a project'),),
                'verbose_name': 'DMP',
                'ordering': ['title', 'status'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
            managers=[
                ('object', django.db.models.manager.Manager()),
            ],
        ),
        migrations.CreateModel(
            name='DmpForm',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=128, verbose_name='title of the dmp form')),
                ('description', models.TextField(verbose_name='description of the dmp form')),
            ],
            options={
                'verbose_name_plural': 'DMP Forms',
                'verbose_name': 'DMP Form',
                'ordering': ['title'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
            managers=[
                ('object', django.db.models.manager.Manager()),
            ],
        ),
        migrations.CreateModel(
            name='DmpFormData',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('value', models.TextField(blank=True, verbose_name='value of the dmp form data')),
                ('name', models.CharField(max_length=128, verbose_name='name of the dmp form data')),
                ('type', models.CharField(choices=[('TXF', 'Textfield'), ('TXA', 'Textarea'), ('NUM', 'Number')], default='TXF', max_length=5, verbose_name='type of the dmp form data')),
                ('infotext', models.TextField(verbose_name='infotext of the dmp form data')),
                ('dmp', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dmps', to='dmp.Dmp', verbose_name='Which dmp is this dmp form data associated to')),
            ],
            options={
                'verbose_name_plural': 'DMP Form Data',
                'permissions': (('view_dmp_form_data', 'Can view dmp form data of a project'),),
                'verbose_name': 'DMP Form Data',
                'ordering': ['name', 'type'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
            managers=[
                ('object', django.db.models.manager.Manager()),
            ],
        ),
        migrations.CreateModel(
            name='DmpFormField',
            fields=[
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=128, verbose_name='name of the dmp form field')),
                ('type', models.CharField(choices=[('TXF', 'Textfield'), ('TXA', 'Textarea'), ('NUM', 'Number')], default='TXF', max_length=5, verbose_name='type of the dmp form field')),
                ('infotext', models.TextField(verbose_name='infotext of the dmp form field')),
                ('dmp_form', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dmp_form_fields', to='dmp.DmpForm', verbose_name='Which dmp form is this dmp form field associated to')),
            ],
            options={
                'verbose_name_plural': 'DMP Form Fields',
                'verbose_name': 'DMP Form Field',
                'ordering': ['name', 'type'],
            },
            bases=(models.Model, django_changeset.models.mixins.RevisionModelMixin),
            managers=[
                ('object', django.db.models.manager.Manager()),
            ],
        ),
        migrations.AddField(
            model_name='dmpformdata',
            name='dmp_form_field',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dmp_form_data', to='dmp.DmpFormField', verbose_name='Which dmp form field is this dmp form data associated to'),
        ),
        migrations.AddField(
            model_name='dmp',
            name='dmp_form',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dmps', to='dmp.DmpForm', verbose_name='Which dmp form is this dmp associated to'),
        ),
        migrations.AddField(
            model_name='dmp',
            name='project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dmps', to='projects.Project', verbose_name='Which project is this dmp associated to'),
        ),
    ]
