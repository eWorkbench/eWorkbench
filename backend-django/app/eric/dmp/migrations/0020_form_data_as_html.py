# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from bs4 import BeautifulSoup
from django.db import migrations
from django_cleanhtmlfield.helpers import clean_html

import django_cleanhtmlfield.fields
from eric.core.models import disable_permission_checks


def migrate_dmp_text_to_html(apps, schema_editor):
    DmpFormData = apps.get_model('dmp', 'DmpFormData')

    with disable_permission_checks(DmpFormData):
        for data in DmpFormData.objects.all():
            if data.type == 'TXA': # only TextAreas become HTML
                data.value = convert_text_to_html(data.value)
                data.save()


def migrate_dmp_html_to_text(apps, schema_editor):
    DmpFormData = apps.get_model('dmp', 'DmpFormData')

    with disable_permission_checks(DmpFormData):
        for data in DmpFormData.objects.all():
            if data.type == 'TXA':  # only TextAreas were HTML
                data.value = convert_html_to_text(data.value)
                data.save()


def convert_text_to_html(input_str):
    input_str = "<p>" + input_str + "</p>"

    soup = BeautifulSoup(input_str, "html.parser")
    input_str = soup.encode_contents(encoding="utf8").decode("utf8")

    # convert newlines to line breaks
    input_str = input_str.replace(u"\n", u"<br/>")

    return clean_html(input_str, strip_unsafe=True)


def convert_html_to_text(input_str):
    # remove all existing newlines
    input_str = input_str.replace(u"\n", u"")

    # convert line breaks to newlines
    input_str = input_str.replace(u"<br>", u"\n")
    input_str = input_str.replace(u"<br/>", u"\n")
    input_str = input_str.replace(u"<br />", u"\n")
    input_str = input_str.replace(u"&nbsp;", u" ")

    # strip all html tags
    soup = BeautifulSoup(input_str, "html.parser")

    return soup.get_text()


class Migration(migrations.Migration):
    dependencies = [
        ('dmp', '0019_changesets'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dmpformdata',
            name='value',
            field=django_cleanhtmlfield.fields.HTMLField(blank=True, verbose_name='value of the dmp form data'),
        ),
        migrations.RunPython(
            migrate_dmp_text_to_html,
            migrate_dmp_html_to_text
        )
    ]
