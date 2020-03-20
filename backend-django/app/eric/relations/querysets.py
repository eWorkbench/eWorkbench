#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import Q
from django_changeset.models.queryset import ChangeSetQuerySetMixin

from eric.projects.models.querysets import BaseQuerySet


class RelationQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    def viewable(self, *args, **kwargs):
        """
        Relations are only viewable if they are not private and/or the current user
        :param args:
        :param kwargs:
        :return:
        """
        return self.filter(private=False) | self.filter(private=True).created_by_current_user()

    # editable only when the current user is the creator
    def editable(self, *args, **kwargs):
        """
        Relations are only editable if the current user is the creator
        :param args:
        :param kwargs:
        :return:
        """
        return self.created_by_current_user()

    # deletable only when the current user is the creator
    def deletable(self, *args, **kwargs):
        """
        Relations are only deletable if the creator is the current user
        :param args:
        :param kwargs:
        :return:
        """
        return self.created_by_current_user()

    def for_model(self, model_class, model_pk, *args, **kwargs):
        """
        Checks left_content_type and right_content_type aswell as left_object_id and right_object_id and matches those
        with model_class.get_content_type() and model_pk
        :param model_class: Class of the Model that needs to be filtered
        :param model_pk: Primary Key of the Object that needs to be filtered
        :param args:
        :param kwargs:
        :return:
        """

        return self.filter(
            Q(
                left_content_type=model_class.get_content_type(),
                left_object_id=model_pk
            ) |
            Q(
                right_content_type=model_class.get_content_type(),
                right_object_id=model_pk
            )
        )
