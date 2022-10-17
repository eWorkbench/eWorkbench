#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models


class ModelPrivilegeMixIn(models.Model):
    """
    Mixin which provides the generic relation to model privileges
    """

    class Meta:
        abstract = True

    # define generic reverse relation for entity permission assignments
    model_privileges = GenericRelation(
        "model_privileges.ModelPrivilege",
        content_type_field="content_type",
        object_id_field="object_id",
    )
