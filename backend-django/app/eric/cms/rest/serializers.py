#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from rest_framework import serializers

from eric.cms.models import Content


class MinimalContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = ('title', 'text', 'public')
