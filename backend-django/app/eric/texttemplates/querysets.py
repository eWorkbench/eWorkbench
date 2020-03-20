#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_changeset.models.queryset import ChangeSetQuerySetMixin
from eric.core.models import BaseQuerySet


class TextTemplateQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    pass
