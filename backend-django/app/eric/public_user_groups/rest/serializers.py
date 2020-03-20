#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import serializers

from django.contrib.auth.models import Group


class PublicUserGroupsSerializer(serializers.ModelSerializer):
    """ Use for public user groups """

    class Meta:
        model = Group
        fields = ('pk', 'name',)
