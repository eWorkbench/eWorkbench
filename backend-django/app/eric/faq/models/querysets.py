#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_userforeignkey.request import get_current_user

from eric.core.models import BaseQuerySet


class FAQCategoryQuerySet(BaseQuerySet):
    def viewable(self, *args, **kwargs):
        return self.all()

    def editable(self, *args, **kwargs):
        user = get_current_user()
        if user.is_superuser:
            return self.all()
        else:
            return self.none()

    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        :param args:
        :param kwargs:
        :return:
        """
        return self.prefetch_related()


class FAQQuestionAndAnswerQuerySet(BaseQuerySet):
    def viewable(self, *args, **kwargs):
        return self.all()

    def editable(self, *args, **kwargs):
        user = get_current_user()
        if user.is_superuser:
            return self.all()
        else:
            return self.none()

    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        :param args:
        :param kwargs:
        :return:
        """
        return self.prefetch_related()
