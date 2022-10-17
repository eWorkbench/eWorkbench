#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.forms import ModelForm

from django_json_widget.widgets import JSONEditorWidget

from eric.kanban_boards.models.models import KanbanBoardUserFilterSetting


class KanbanBoardUserFilterSettingForm(ModelForm):
    class Meta:
        model = KanbanBoardUserFilterSetting
        fields = "__all__"
        widgets = {"settings": JSONEditorWidget(mode="code")}
