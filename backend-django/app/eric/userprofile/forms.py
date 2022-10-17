#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.forms import ModelForm

from django_json_widget.widgets import JSONEditorWidget

from eric.userprofile.models import UserProfile


class UserProfileForm(ModelForm):
    class Meta:
        model = UserProfile
        fields = "__all__"
        widgets = {"ui_settings": JSONEditorWidget(mode="code")}
