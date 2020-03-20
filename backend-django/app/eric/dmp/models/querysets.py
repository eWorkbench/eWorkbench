#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_changeset.models.queryset import ChangeSetQuerySetMixin

from django_changeset.models.queryset import ChangeSetQuerySetMixin

from eric.core.models import BaseQuerySet
from eric.projects.models.querysets import BaseProjectEntityPermissionQuerySet


class BaseProjectDmpPermissionQuerySet(BaseProjectEntityPermissionQuerySet):
    """
    This Queryset is for Models that are related to Dmps, e.g. DmpFormData
    It forms the Base and basically works like this:
    An item that is related is viewable, if the dmp is viewable
    An item that is related is editable, if the dmp is editable
    An item that is related is deletable, if the dmp is editable (! editable is used on purpose)
    """

    def viewable(self, *args, **kwargs):
        """
        Returns all elements where the related dmp is viewable
        """
        from eric.dmp.models import Dmp

        return self.filter(dmp__pk__in=Dmp.objects.viewable().values_list('pk'))

    def editable(self, *args, **kwargs):
        """
        Returns all elements where the related dmp is editable
        """
        from eric.dmp.models import Dmp

        return self.filter(dmp__pk__in=Dmp.objects.editable().values_list('pk'))

    def deletable(self, *args, **kwargs):
        """
        Returns all elements where the related dmp is editable (! editable is used on purpose)
        """
        from eric.dmp.models import Dmp

        return self.filter(dmp__pk__in=Dmp.objects.editable().values_list('pk'))


class DmpQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        """
        return super(DmpQuerySet, self).prefetch_common() \
            .prefetch_metadata()


class DmpFormQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    pass


class DmpFormFieldQuerySet(BaseQuerySet, ChangeSetQuerySetMixin):
    pass


class DmpFormDataQuerySet(BaseProjectDmpPermissionQuerySet, ChangeSetQuerySetMixin):
    pass
