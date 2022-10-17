#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth.models import Group

from rest_framework import serializers


class PublicUserGroupsSerializer(serializers.ModelSerializer):
    """Use for public user groups"""

    class Meta:
        model = Group
        fields = (
            "pk",
            "name",
        )
