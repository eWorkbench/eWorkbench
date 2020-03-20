#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.forms import ModelForm
from django_json_widget.widgets import JSONEditorWidget

from eric.metadata.models.models import Metadata, MetadataField


class MetadataForm(ModelForm):
    class Meta:
        model = Metadata
        fields = '__all__'
        widgets = {
            'values': JSONEditorWidget(mode='code')
        }


class MetadataFieldForm(ModelForm):
    class Meta:
        model = MetadataField
        fields = '__all__'
        widgets = {
            'type_settings': JSONEditorWidget(mode='code')
        }
