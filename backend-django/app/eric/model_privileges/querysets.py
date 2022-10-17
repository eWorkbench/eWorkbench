#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import Q

from django_changeset.models.queryset import ChangeSetQuerySetMixin

from eric.projects.models.querysets import BaseQuerySet


class ModelPrivilegeQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    """
    QuerySet that determines who is allowed to view, edit and delete model privileges (for now, everybody)
    """

    def viewable(self, *args, **kwargs):
        return self.all()

    def editable(self, *args, **kwargs):
        return self.all()

    def deletable(self, *args, **kwargs):
        return self.all()

    def for_model(self, model_class, *args, **kwargs):
        """
        Selects Model Privileges for a certain model
        :param model_class: Class of the Model that needs to be filtered
        :param args:
        :param kwargs:
        :return:
        """

        return self.filter(content_type=model_class.get_content_type())
