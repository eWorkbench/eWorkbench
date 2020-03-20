#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.db.models import Q
from django_changeset.models.queryset import ChangeSetQuerySetMixin

from eric.pictures.models.querysets import PictureQuerySet
from eric.projects.models.querysets import BaseProjectEntityPermissionQuerySet, \
    extend_queryset
from eric.shared_elements.models.querysets import NoteQuerySet, FileQuerySet

logger = logging.getLogger(__name__)


@extend_queryset(PictureQuerySet)
class ExtendedLabBookPictureQuerySet:
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
        from eric.labbooks.models import LabBookChildElement
        from eric.pictures.models import Picture

        # get all viewable LabBookChildElements that contain a picture
        picture_pks = LabBookChildElement.objects.viewable().filter(
            child_object_content_type=Picture.get_content_type()
        ).values_list('child_object_id')

        # The following is equal to Picture.filter(pk__in=note_pks)
        return Q(
            pk__in=picture_pks
        )

    @staticmethod
    def _editable():
        """
        Extend PictureQuerySet such that it allows editing of Picture that are assigned in a Labbook where the current
        user is allowed to edit the LabBook
        :return: django.db.models.Q
        """
        from eric.labbooks.models import LabBookChildElement
        from eric.pictures.models import Picture

        # get all viewable LabBookChildElements that contain a note
        picture_pks = LabBookChildElement.objects.editable().filter(
            child_object_content_type=Picture.get_content_type()
        ).values_list('child_object_id')

        # The following is equal to Picture.filter(pk__in=note_pks)
        return Q(
            pk__in=picture_pks
        )


@extend_queryset(NoteQuerySet)
class ExtendedLabBookNoteQuerySet:
    """
    Extending the Note QuerySet for LabBooks
    If a Note is in a LabBook, users are allowed to view and/or edit those notes if they are allowed to view/edit the
    LabBook
    """

    @staticmethod
    def _viewable():
        """
        Extend NoteQuerySet such that it allows viewing of Notes that are assigned in a Labbook where the current
        user is allowed to view the LabBook
        :return: django.db.models.Q
        """
        from eric.shared_elements.models import Note
        from eric.labbooks.models import LabBookChildElement

        # get all viewable LabBookChildElements that contain a note
        note_pks = LabBookChildElement.objects.viewable().filter(
            child_object_content_type=Note.get_content_type()
        ).values_list('child_object_id')

        # The following is equal to Note.filter(pk__in=note_pks)
        return Q(
            pk__in=note_pks
        )

    @staticmethod
    def _editable():
        """
        Extend NoteQuerySet such that it allows editing of Notes that are assigned in a Labbook where the current
        user is allowed to edit the LabBook
        :return: django.db.models.Q
        """
        from eric.shared_elements.models import Note
        from eric.labbooks.models import LabBookChildElement

        # get all viewable LabBookChildElements that contain a note
        note_pks = LabBookChildElement.objects.editable().filter(
            child_object_content_type=Note.get_content_type()
        ).values_list('child_object_id')

        # The following is equal to Note.filter(pk__in=note_pks)
        return Q(
            pk__in=note_pks
        )


@extend_queryset(FileQuerySet)
class ExtendedLabBookFileQuerySet:
    """
    Extending the File QuerySet for LabBooks
    If a File is in a LabBook, users are allowed to view and/or edit those files if they are allowed to view/edit the
    LabBook
    """

    @staticmethod
    def _viewable():
        """
        Extend FileQuerySet such that it allows viewing of Notes that are assigned in a Labbook where the current
        user is allowed to view the LabBook
        :return: django.db.models.Q
        """
        from eric.shared_elements.models import File
        from eric.labbooks.models import LabBookChildElement

        # get all viewable LabBookChildElements that contain a note
        file_pks = LabBookChildElement.objects.viewable().filter(
            child_object_content_type=File.get_content_type()
        ).values_list('child_object_id')

        # the following is equal to File.filter(pk__in=file_pks)
        return Q(
            pk__in=file_pks
        )

    @staticmethod
    def _editable():
        """
        Extend FileQuerySet such that it allows editing of Notes that are assigned in a Labbook where the current
        user is allowed to edit the LabBook
        :return: django.db.models.Q
        """
        from eric.shared_elements.models import File
        from eric.labbooks.models import LabBookChildElement

        # get all viewable LabBookChildElements that contain a note
        file_pks = LabBookChildElement.objects.editable().filter(
            child_object_content_type=File.get_content_type()
        ).values_list('child_object_id')

        # the following is equal to File.filter(pk__in=file_pks)
        return Q(
            pk__in=file_pks
        )


class LabBookQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        """
        return super(LabBookQuerySet, self).prefetch_common() \
            .prefetch_metadata()


class BaseLabBookPermissionQuerySet(BaseProjectEntityPermissionQuerySet):
    """
    This QuerySet is for Models that are related to LabBooks, e.g. LabBook Child Elements
    It forms the Base and basically works like this:
    An item that is related is viewable, if the LabBook is viewable
    An item that is related is editable, if the LabBook is editable
    An item that is related is deletable, if the LabBook is editable (! editable is used on purpose)
    """

    def viewable(self, *args, **kwargs):
        """
        Returns all elements where the related labbook is viewable
        """
        from eric.labbooks.models import LabBook

        return self.filter(lab_book__pk__in=LabBook.objects.viewable().values_list('pk'))

    def editable(self, *args, **kwargs):
        """
        Returns all elements where the related labbook is editable
        """
        from eric.labbooks.models import LabBook

        return self.filter(lab_book__pk__in=LabBook.objects.editable().values_list('pk'))

    def deletable(self, *args, **kwargs):
        """
        Returns all elements where the related labbook is editable (! editable is used on purpose)
        """
        from eric.labbooks.models import LabBook

        return self.filter(lab_book__pk__in=LabBook.objects.editable().values_list('pk'))


class LabBookChildElementQuerySet(BaseLabBookPermissionQuerySet):
    pass


class LabbookSectionQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    """
    LabbookSection QuerySet for LabBooks
    """
    def related_viewable(self, *args, **kwargs):
        """
        LabBook sections are always viewable if they are related
        :param args:
        :param kwargs:
        :return:
        """
        return self.all()

    def prefetch_common(self, *args, **kwargs):
        """
        Prefetch common attributes
        """
        return super(LabbookSectionQuerySet, self).prefetch_common()


@extend_queryset(LabbookSectionQuerySet)
class ExtendedLabbookSectionQuerySet:
    """
    LabbookSection QuerySet for LabBooks
    If a LabbookSection is in a LabBook, users are allowed to view and/or edit and/or delete those sections
    if they are allowed to view/edit/delete the LabBook
    """

    @staticmethod
    def _viewable():
        """
        Allows viewing of LabbookSections that are assigned in a Labbook where the current
        user is allowed to view the LabBook
        :return: django.db.models.Q
        """
        from eric.labbooks.models.models import LabbookSection
        from eric.labbooks.models import LabBookChildElement

        # get all viewable LabBookChildElements that contain a section
        labbooksection_pks = LabBookChildElement.objects.viewable().filter(
            child_object_content_type=LabbookSection.get_content_type()
        ).values_list('child_object_id')

        return Q(
            pk__in=labbooksection_pks
        )

    @staticmethod
    def _editable():
        """
        Allows viewing of LabbookSections that are assigned in a Labbook where the current
        user is allowed to view the LabBook
        :return: django.db.models.Q
        """
        from eric.labbooks.models.models import LabbookSection
        from eric.labbooks.models import LabBookChildElement

        # get all viewable LabBookChildElements that contain a section
        labbooksection_pks = LabBookChildElement.objects.editable().filter(
            child_object_content_type=LabbookSection.get_content_type()
        ).values_list('child_object_id')

        return Q(
            pk__in=labbooksection_pks
        )

    @staticmethod
    def _deletable():
        """
        Allows viewing of LabbookSections that are assigned in a Labbook where the current
        user is allowed to view the LabBook
        :return: django.db.models.Q
        """
        from eric.labbooks.models.models import LabbookSection
        from eric.labbooks.models import LabBookChildElement

        # get all viewable LabBookChildElements that contain a section
        labbooksection_pks = LabBookChildElement.objects.deletable().filter(
            child_object_content_type=LabbookSection.get_content_type()
        ).values_list('child_object_id')

        return Q(
            pk__in=labbooksection_pks
        )
