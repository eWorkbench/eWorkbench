#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.forms import ModelForm

from django_json_widget.widgets import JSONEditorWidget

from eric.versions.models.models import Version


class VersionForm(ModelForm):
    class Meta:
        model = Version
        fields = "__all__"
        widgets = {"metadata": JSONEditorWidget(mode="code")}
