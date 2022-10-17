#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import Q

from django_changeset.models.queryset import ChangeSetQuerySetMixin

from eric.projects.models.querysets import BaseProjectEntityPermissionQuerySet, extend_queryset
from eric.shared_elements.models.querysets import FileQuerySet


@extend_queryset(FileQuerySet)
class ExtendedDriveFileQuerySet:
    """
    Extending Picture QuerySet for LabBooks
    If a Picture is in a LabBook, users are allowed to view and/or edit those pictures if they are allowed to view/edit
    the LabBook
    """

    @staticmethod
    def _viewable():
        """
        Extend PictureQuerySet such that it allows viewing of Picture that are assigned in a Labbook where the current
        user is allowed to view the LabBook
        :return: django.db.models.Q
        """
        from eric.drives.models import Drive

        # get all viewable LabBookChildElements that contain a picture
        file_pks = Drive.objects.viewable().values_list("sub_directories__files")

        # The following is equal to Picture.filter(pk__in=note_pks)
        return Q(pk__in=file_pks)


class DriveQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    def prefetch_common(self, *args, **kwargs):
        return (
            super()
            .prefetch_common(*args, **kwargs)
            .prefetch_related(
                "sub_directories",
                "sub_directories__created_by",
                "sub_directories__created_by__userprofile",
                "sub_directories__last_modified_by",
                "sub_directories__last_modified_by__userprofile",
            )
        )


class BaseDriveQuerySet(BaseProjectEntityPermissionQuerySet):
    """
    This QuerySet is for Models that are related to Drives, e.g. Drive Child Elements
    It forms the Base and basically works like this:
    An item that is related is viewable, if the Drive is viewable
    An item that is related is editable, if the Drive is editable
    An item that is related is deletable, if the Drive is editable (! editable is used on purpose)
    """

    def viewable(self, *args, **kwargs):
        """
        Returns all elements where the related drive is viewable
        """
        from eric.drives.models import Drive

        return self.filter(drive__pk__in=Drive.objects.viewable().values_list("pk"))

    def editable(self, *args, **kwargs):
        """
        Returns all elements where the related drive is editable
        """
        from eric.drives.models import Drive

        return self.filter(drive__pk__in=Drive.objects.editable().values_list("pk"))

    def deletable(self, *args, **kwargs):
        """
        Returns all elements where the related drive is editable (! editable is used on purpose)
        """
        from eric.drives.models import Drive

        return self.filter(drive__pk__in=Drive.objects.editable().values_list("pk"))


class DirectoryQuerySet(BaseDriveQuerySet):
    pass
