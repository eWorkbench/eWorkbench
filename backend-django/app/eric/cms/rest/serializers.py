#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from rest_framework import serializers

from eric.cms.models import Content
from eric.cms.models.models import AcceptedScreen, LaunchScreen


class MinimalContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = ("title", "text", "public", "last_modified_at")


class LaunchScreenSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaunchScreen
        fields = ("pk", "title", "text", "version", "last_modified_at")


class AcceptedScreenSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcceptedScreen
        fields = ("launch_screen", "accepted_version", "accepted_timestamp")
