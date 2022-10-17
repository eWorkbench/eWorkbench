#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Generated by Django 2.2.20 on 2021-04-29 12:02

import uuid

import django.contrib.postgres.search
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import ckeditor_uploader.fields
import django_changeset.models.mixins
import django_userforeignkey.models.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FAQCategory',
            fields=[
                ('ordering', models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(db_index=True, max_length=512, verbose_name='title of the FAQ category')),
                ('slug', models.SlugField(max_length=512, unique=True, verbose_name='unique slug of the FAQ category')),
                ('public', models.BooleanField(db_index=True, default=False, verbose_name='Whether this FAQ category is public')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
            ],
            options={
                'verbose_name': 'FAQ Category',
                'verbose_name_plural': 'FAQ Categories',
                'ordering': ('ordering',),
            },
        ),
        migrations.CreateModel(
            name='FAQQuestionAndAnswer',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, null=True, verbose_name='Date when this element was created')),
                ('last_modified_at', models.DateTimeField(auto_now=True, db_index=True, null=True, verbose_name='Date when this element was last modified')),
                ('ordering', models.PositiveIntegerField(db_index=True, default=0, verbose_name='Ordering')),
                ('version_number', django_changeset.models.mixins.ChangesetVersionField(default=0)),
                ('fts_index', django.contrib.postgres.search.SearchVectorField(editable=False, null=True, verbose_name='FTS Index')),
                ('fts_language', models.CharField(choices=[('german', 'German'), ('english', 'English')], default='english', max_length=64, verbose_name='FTS Language')),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('question', models.CharField(db_index=True, max_length=4096, verbose_name='FAQ question')),
                ('answer', ckeditor_uploader.fields.RichTextUploadingField(blank=True, verbose_name='FAQ answer')),
                ('public', models.BooleanField(db_index=True, default=False, verbose_name='Whether this FAQ question and answer is public')),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='faq_questions_and_answers', to='faq.FAQCategory')),
                ('created_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='faqquestionandanswer_created', to=settings.AUTH_USER_MODEL, verbose_name='User that created this element')),
                ('last_modified_by', django_userforeignkey.models.fields.UserForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='faqquestionandanswer_modified', to=settings.AUTH_USER_MODEL, verbose_name='User that last modified this element')),
            ],
            options={
                'verbose_name': 'FAQ Question and Answer',
                'verbose_name_plural': 'FAQ Questions and Answers',
                'ordering': ('ordering',),
                'unique_together': {('question', 'category')},
            },
            bases=(django_changeset.models.mixins.RevisionModelMixin, models.Model),
        ),
    ]
