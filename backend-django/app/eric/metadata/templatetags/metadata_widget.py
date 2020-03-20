#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django import template

from eric.metadata.models.models import Metadata
from eric.metadata.utils import MetadataFormatter

register = template.Library()


def build_context(entity_instance):
    return {
        'metadata_list': [{
            'field_name': metadata.field.name,
            'display_value': MetadataFormatter().format(metadata)
        } for metadata in Metadata.objects.filter(entity_id=entity_instance.pk)]
    }


@register.inclusion_tag('widgets/metadata.html')
def all_metadata_as_html(entity_instance):
    """
    Displays all related metadata as HTML.
    :param entity_instance:
    :return:
    """

    return build_context(entity_instance)


@register.inclusion_tag('widgets/metadata.txt')
def all_metadata_as_text(entity_instance):
    """
    Displays all related metadata as text.
    :param entity_instance:
    :return:
    """

    return build_context(entity_instance)


@register.inclusion_tag('widgets/metadata.xml')
def all_metadata_as_xml(entity_instance):
    """
    Displays all related metadata as XML.
    :param entity_instance:
    :return:
    """

    return build_context(entity_instance)
