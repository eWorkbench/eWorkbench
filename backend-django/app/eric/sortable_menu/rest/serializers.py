#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import transaction

from rest_framework_nested.relations import NestedHyperlinkedIdentityField

from eric.core.rest.serializers import BaseModelSerializer, HyperlinkedToListField
from eric.sortable_menu.models import MenuEntry, MenuEntryParameter


class MenuEntryParameterSerializer(BaseModelSerializer):
    class Meta:
        model = MenuEntryParameter
        fields = (
            "name",
            "value",
        )


class MenuEntrySerializer(BaseModelSerializer):
    """
    Serializer for Menu Entries, showing also the menu_entry_parameters
    """

    menu_entry_parameters = MenuEntryParameterSerializer(many=True, read_only=True)

    class Meta:
        model = MenuEntry
        # Note: if you add the owner field, make sure it is set to readonly
        fields = (
            "id",
            "pk",
            "route",
            "ordering",
            "menu_entry_parameters",
            "visible",
            "url",
        )
