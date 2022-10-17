#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.contenttypes.fields import GenericRelation

from eric.metadata.models.models import Metadata


class MetadataRelation(GenericRelation):
    """
    Shortcut for:
    GenericRelation(Metadata, object_id_field='entity_id', content_type_field='entity_content_type', )
    """

    def __init__(self):
        super().__init__(
            Metadata,
            object_id_field="entity_id",
            content_type_field="entity_content_type",
        )
