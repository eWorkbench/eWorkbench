# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import migrations, models
from django.utils.text import slugify


def set_defaults(apps, schema_editor):
    faqs = apps.get_model('faq', 'FAQQuestionAndAnswer')
    for faq in faqs.objects.all().iterator():
        faq.slug = slugify(faq.question)
        faq.save()


class Migration(migrations.Migration):

    dependencies = [
        ('faq', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='faqquestionandanswer',
            name='slug',
            field=models.SlugField(
                null=True,
                max_length=512,
                unique=False,
                db_index=False,
                verbose_name='Unique slug for linking to this question',
            ),
        ),
        migrations.RunPython(set_defaults, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='faqquestionandanswer',
            name='slug',
            field=models.SlugField(
                null=False,
                max_length=512,
                unique=True,
                db_index=True,
                verbose_name='Unique slug for linking to this question',
            ),
        ),
    ]
