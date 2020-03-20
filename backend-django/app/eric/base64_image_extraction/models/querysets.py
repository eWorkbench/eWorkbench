#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_changeset.models.queryset import ChangeSetQuerySetMixin
from eric.core.models import BaseQuerySet


class ExtractedImageQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    """
    Basic QuerySet for ExtractedImage model
    """

    def viewable(self):
        return self.all()

    def editable(self, *args, **kwargs):
        """
        Extracted images are only editable if the current user is the creator
        :param args:
        :param kwargs:
        :return:
        """
        return self.created_by_current_user()

    def deletable(self, *args, **kwargs):
        """
        Extracted images are only editable if the current user is the creator
        :param args:
        :param kwargs:
        :return:
        """
        return self.created_by_current_user()
