#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import serializers

from eric.core.rest.serializers import PublicUserSerializer

from eric.projects.models import ElementLock


class ElementLockSerializer(serializers.ModelSerializer):
    """ Serializer for ElementLock """
    locked_by = PublicUserSerializer(read_only=True)

    locked_until = serializers.DateTimeField()

    class Meta:
        model = ElementLock
        fields = ('pk', 'locked_at', 'locked_by', 'content_type', 'object_id', 'locked_until', )
