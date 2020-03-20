#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import serializers

from eric.core.rest.serializers import BaseModelWithCreatedBySerializer
from eric.shared_elements.models import ElementLabel


class ElementLabelPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        return ElementLabel.objects.all()


class ElementLabelSerializer(BaseModelWithCreatedBySerializer):
    """ REST API Serializer for Element Labels """
    class Meta:
        model = ElementLabel
        fields = (
            'name', 'color', 'font_color'
        )
