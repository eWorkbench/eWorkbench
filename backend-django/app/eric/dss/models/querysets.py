#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import Q

from django_changeset.models.queryset import ChangeSetQuerySetMixin
from django_userforeignkey.request import get_current_user

from eric.core.models import BaseQuerySet
from eric.drives.models.querysets import DriveQuerySet
from eric.projects.models.querysets import BaseProjectEntityPermissionQuerySet, extend_queryset
from eric.shared_elements.models.querysets import FileQuerySet


@extend_queryset(FileQuerySet)
class ExtendedDSSContainerFileQuerySet:
    @staticmethod
    def _viewable():
        from eric.dss.models import DSSContainer

        file_pks = DSSContainer.objects.viewable().values_list("dss_envelopes__drives__sub_directories__files")
        return Q(pk__in=file_pks)

    @staticmethod
    def _editable():
        from eric.dss.models import DSSContainer

        file_pks = DSSContainer.objects.editable().values_list("dss_envelopes__drives__sub_directories__files")
        return Q(pk__in=file_pks)

    @staticmethod
    def _deleteable():
        from eric.dss.models import DSSContainer

        file_pks = DSSContainer.objects.deletable().values_list("dss_envelopes__drives__sub_directories__files")
        return Q(pk__in=file_pks)


@extend_queryset(DriveQuerySet)
class ExtendedDSSDriveFileQuerySet:
    @staticmethod
    def _viewable():
        from eric.dss.models import DSSContainer

        drive_pks = DSSContainer.objects.viewable().values_list("dss_envelopes__drives")
        return Q(pk__in=drive_pks)

    @staticmethod
    def _editable():
        from eric.dss.models import DSSContainer

        drive_pks = DSSContainer.objects.editable().values_list("dss_envelopes__drives")
        return Q(pk__in=drive_pks)

    @staticmethod
    def _deleteable():
        from eric.dss.models import DSSContainer

        drive_pks = DSSContainer.objects.deletable().values_list("dss_envelopes__drives")
        return Q(pk__in=drive_pks)


class DSSContainerQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    def viewable(self, *args, **kwargs):
        return self.for_current_user()

    def editable(self, *args, **kwargs):
        return self.for_current_user()

    def trashable(self, *args, **kwargs):
        return self.for_current_user()

    def restorable(self, *args, **kwargs):
        return self.for_current_user()

    def deletable(self, *args, **kwargs):
        return self.for_current_user()

    def for_current_user(self):
        user = get_current_user()
        if user.is_anonymous:
            return self.none()
        elif user.is_superuser:
            return self.all()
        return self.filter(created_by=user)


class DSSEnvelopeQuerySet(BaseQuerySet):
    def viewable(self, *args, **kwargs):
        return self.for_current_user()

    def editable(self, *args, **kwargs):
        return self.for_current_user()

    def trashable(self, *args, **kwargs):
        return self.for_current_user()

    def restorable(self, *args, **kwargs):
        return self.for_current_user()

    def deletable(self, *args, **kwargs):
        return self.for_current_user()

    def for_current_user(self):
        user = get_current_user()
        if user.is_anonymous:
            return self.none()
        elif user.is_superuser:
            return self.all()
        return self.filter(created_by=user)

    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        :param args:
        :param kwargs:
        :return:
        """
        return self.prefetch_related(
            "drives",
        )


class DSSFilesToImportQuerySet(BaseQuerySet):
    def viewable(self, *args, **kwargs):
        return self.all()

    def editable(self, *args, **kwargs):
        return self.all()

    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        :param args:
        :param kwargs:
        :return:
        """
        return self.prefetch_related()
