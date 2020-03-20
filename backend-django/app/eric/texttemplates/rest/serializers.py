#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.serializers import BaseModelSerializer
from eric.texttemplates.models import TextTemplate


class TextTemplateSerializer(BaseModelSerializer):
    """ Serializer for Text Templates """

    class Meta:
        model = TextTemplate
        fields = ('name', 'content', 'url')
