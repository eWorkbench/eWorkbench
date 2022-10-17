#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.serializers import BaseModelWithCreatedByAndSoftDeleteSerializer, BaseModelWithCreatedBySerializer
from eric.shared_elements.models import CalendarAccess


class CalendarAccessSerializer(BaseModelWithCreatedBySerializer):
    class Meta:
        model = CalendarAccess
        fields = ("pk", "created_by", "created_at", "last_modified_by", "last_modified_at")
