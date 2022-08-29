#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import transaction
from django.db.models import Q, Count, F
from django.http import QueryDict
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django_changeset.models import RevisionModelMixin
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from eric.core.models import disable_permission_checks
from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn, BaseAuthenticatedModelViewSet
from eric.labbooks.models import LabBook, LabBookChildElement, LabbookSection
from eric.labbooks.rest.filters import LabBookFilter, LabbookSectionFilter
from eric.labbooks.rest.serializers import LabBookSerializer, LabBookChildElementSerializer, LabbookSectionSerializer
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn
from eric.relations.models import Relation
from eric.shared_elements.models import Comment


class LabBookChildElementViewSet(BaseAuthenticatedModelViewSet):
    """
    REST API ViewSet for labbook child elements (including the generic foreign key)
    """
    serializer_class = LabBookChildElementSerializer

    # disable pagination for this endpoint
    pagination_class = None

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object)
        """
        super(LabBookChildElementViewSet, self).initial(request, *args, **kwargs)
        # store parent object
        self.parent_object = self.get_parent_object_or_404(*args, **kwargs)

        # since Django 1.11, there is a weird behaviour of QueryDicts that are immutable
        if isinstance(self.request.data, QueryDict):  # however, some request.data objects are normal dictionaries...
            self.request.data._mutable = True

    def create(self, request, *args, **kwargs):
        # set the lab book id as the parent objects primary key
        self.request.data['lab_book_id'] = self.parent_object.pk

        return super(LabBookChildElementViewSet, self).create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        # set the lab book id as the parent objects primary key
        self.request.data['lab_book_id'] = self.parent_object.pk

        return super(LabBookChildElementViewSet, self).update(request, *args, **kwargs)

    def get_serializer(self, *args, **kwargs):
        """ if an array is passed, set serializer to many """
        if isinstance(kwargs.get('data', {}), list):
            kwargs['many'] = True
        return super(LabBookChildElementViewSet, self).get_serializer(*args, **kwargs)

    @staticmethod
    def get_parent_object_or_404(*args, **kwargs):
        """
        Tries to retrieve the parent object (defined via the REST API)
        Raises Http404 if we do not have access to the parent object
        """
        return get_object_or_404(LabBook.objects.viewable(), pk=kwargs['labbook_pk'])

    @action(detail=False, methods=['PUT'])
    @transaction.atomic
    def update_all(self, *args, **kwargs):
        """
        Change positioning, width, height, and order of labbook child elements
        """
        # verify that we are getting an array of data
        assert isinstance(self.request.data, list), "Expected array"

        request_pk_list = []

        # loop over request.data and collect PKs of child element
        for child_element in self.request.data:
            if 'pk' in child_element:
                request_pk_list.append(child_element['pk'])
            else:
                # we do not support creating a new element here
                raise ValidationError(
                    _("Element with no primary key supplied, but this endpoint does not support creating new elements")
                )

        # query all editable LabBookChildElement with all primary keys from the request
        child_elements = LabBookChildElement.objects.filter(
            lab_book=self.parent_object,
            pk__in=request_pk_list
        ).editable()

        # fetch them and put them into a dictionary
        child_elements = {
            str(obj._get_pk_val()): obj for obj in child_elements
        }

        # make sure the elements have the same length (else something is wrong with the pk, assignment or permissions)
        if len(child_elements) != len(request_pk_list):
            raise ValidationError(
                _("Invalid primary key suplied - element does not belong to the labbook")
            )

        # the remainder of this can be done without permission checks (we already know the element is editable)
        with disable_permission_checks(LabBookChildElement):
            for child_element in self.request.data:
                pk = child_element['pk']

                # get item from existing child_elements
                real_item = child_elements[pk]

                # check if anything has changed -> only fire a database query if the element really needs to be changed
                if real_item.position_x != child_element['position_x'] \
                        or real_item.position_y != child_element['position_y'] \
                        or real_item.width != child_element['width'] \
                        or real_item.height != child_element['height']:
                    # something has changed -> update it in database
                    real_item.position_x = child_element['position_x']
                    real_item.position_y = child_element['position_y']
                    real_item.width = child_element['width']
                    real_item.height = child_element['height']

                    real_item.save()

        # call save method of parent object, such that the Django ChangeSet stores the changes on the "related_many"
        # self.parent_object.save()
        # commented out on purpose - this causes an issue with moving elements - see ticket-259775

        # temporarily disable revision model to improve performance for providing the list endpoint here
        RevisionModelMixin.set_enabled(False)
        # ToDo: It is not necessary to return the whole list of elements here (needs frontend adaptation too)
        response = Response(request_pk_list)
        RevisionModelMixin.set_enabled(True)

        return response

    def get_object(self):
        """
        Provides a separate endpoint get_object method that does not re-use the get_queryset method, as
        get_queryset has some optimisations for retrieving all data, versus get_object only retrieving one
        """

        # get the queryset and prefetch the "child_object", which is a generic foreign key
        # this works here because we only have ONE child object
        queryset = LabBookChildElement.objects.viewable().filter(
            lab_book=self.parent_object
        ).prefetch_common().prefetch_related(
            'child_object__created_by', 'child_object__created_by__userprofile',
            'child_object__last_modified_by', 'child_object__last_modified_by__userprofile',
            'child_object__projects'
        )

        # Perform the lookup filtering (usually not needed, but we leave it here as the original get_object also has it)
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        assert_message = ('Expected view %s to be called with a URL keyword argument '
                          'named "%s". Fix your URL conf, or set the `.lookup_field` '
                          'attribute on the view correctly.' %
                          (self.__class__.__name__, lookup_url_kwarg))
        assert lookup_url_kwarg in self.kwargs, assert_message

        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)

        from eric.shared_elements.models import Comment
        comment_content_type_id = Comment.get_content_type().id

        # count number of related comments
        num_related_comments = Relation.objects.filter(
            Q(
                Q(
                    left_content_type_id=obj.child_object_content_type_id,
                    left_object_id=obj.child_object_id
                ) & Q(
                    right_content_type=comment_content_type_id
                )
            ) | Q(
                Q(
                    right_content_type_id=obj.child_object_content_type_id,
                    right_object_id=obj.child_object_id
                ) & Q(
                    left_content_type=comment_content_type_id
                )
            )
        ).count()
        obj.num_related_comments = num_related_comments

        # count number of all other relations
        obj.num_relations = obj.child_object.relations.count() - obj.num_related_comments

        return obj

    def get_queryset(self):
        """
        Returns a QuerySet of LabBook Child Elements, which already contains the child objects
        :return:
        """

        if not hasattr(self, 'parent_object') or not self.parent_object:
            return LabBookChildElement.objects.none()

        # check if there is a section parameter in the request, which should have the pk of the section as value
        section_request = self.request.GET.get('section', '')

        # fetch all child elements (do not use viewable here - if the user can see the labbook, the user can also see
        # the child elements - but not neccessarily the child_object)
        child_elements = LabBookChildElement.objects.all().filter(
            lab_book=self.parent_object
        )
        # if this is a section request we filter child_elements to only return the child elements of the section
        if section_request:
            section_child_elements_pks = LabbookSection.objects.all().filter(
                child_elements__labbooksection=section_request
            ).values('child_elements').distinct()
            child_elements = child_elements.filter(
                pk__in=section_child_elements_pks
            )

        # possible child elements of a labbook are:
        # - file
        # - note
        # - picture
        # - plugin instance
        # - section
        from eric.shared_elements.models import File, Note
        from eric.pictures.models import Picture
        from eric.plugins.models import PluginInstance

        file_content_type_id = File.get_content_type().id
        note_content_type_id = Note.get_content_type().id
        comment_content_type_id = Comment.get_content_type().id
        picture_content_type_id = Picture.get_content_type().id
        plugin_instance_content_type_id = PluginInstance.get_content_type().id

        file_pks = []
        note_pks = []
        picture_pks = []
        plugin_instance_pks = []
        labbooksection_pks = []

        # iterate over all child elements and collect the foreign keys of the referenced child_objects
        for element in child_elements:
            if element.child_object_content_type_id == file_content_type_id:
                file_pks.append(element.child_object_id)
            elif element.child_object_content_type_id == note_content_type_id:
                note_pks.append(element.child_object_id)
            elif element.child_object_content_type_id == picture_content_type_id:
                picture_pks.append(element.child_object_id)
            elif element.child_object_content_type_id == plugin_instance_content_type_id:
                plugin_instance_pks.append(element.child_object_id)
            elif element.is_labbook_section:
                labbooksection_pks.append(element.child_object_id)
            else:
                # unexpected type
                print("error: unexpected labbook childelement type {}".format(element.child_object_content_type_id))

        # now we need to filter out the child elements of all sections, so they are now returned
        # and loaded in the frontend
        # 1. get the a list of top level elements that are not sections
        child_elements_pks = []
        for element in child_elements:
            if not element.is_labbook_section:
                child_elements_pks.append(element.pk)

        # 2. get all sections
        sections = LabbookSection.objects.all().filter(
            child_elements__labbooksection__in=labbooksection_pks
        ).values('child_elements').distinct()

        # 3. get all section child elements
        sections_child_elements = LabBookChildElement.objects.all().filter(
            pk__in=sections
        ).values('child_object_id').distinct()
        section_pks = []
        for section_pk in sections_child_elements:
            for note_pk in note_pks:
                if str(note_pk) in str(section_pk):
                    section_pks.append(note_pk)
            for file_pk in file_pks:
                if str(file_pk) in str(section_pk):
                    section_pks.append(file_pk)
            for picture_pk in picture_pks:
                if str(picture_pk) in str(section_pk):
                    section_pks.append(picture_pk)
            for plugin_instance_pk in plugin_instance_pks:
                if str(plugin_instance_pk) in str(section_pk):
                    section_pks.append(plugin_instance_pk)
        # 4. filter out the section child elements, so only top level LabBook child elements are left
        child_elements = child_elements.exclude(child_object_id__in=section_pks)

        # fetch all (viewable) notes (collected form child_elements), exclude section child elements
        notes = Note.objects.viewable().filter(pk__in=note_pks). \
            exclude(pk__in=section_pks). \
            prefetch_common(). \
            prefetch_related(
            'projects',
        ).in_bulk()

        # fetch all (viewable) files (collected form child_elements), exclude section child elements
        files = File.objects.viewable().filter(pk__in=file_pks). \
            exclude(pk__in=section_pks). \
            prefetch_common(). \
            prefetch_related(
            'projects',
        ).in_bulk()

        # fetch all (viewable) pictures (collected form child_elements), exclude section child elements
        pictures = Picture.objects.viewable().filter(pk__in=picture_pks). \
            exclude(pk__in=section_pks). \
            prefetch_common(). \
            prefetch_related(
            'projects',
        ).in_bulk()

        # fetch all (viewable) plugin instances (collected form child_elements), exclude section child elements
        plugin_instances = PluginInstance.objects.viewable().filter(pk__in=plugin_instance_pks). \
            exclude(pk__in=section_pks). \
            prefetch_common(). \
            prefetch_related(
            'projects',
        ).in_bulk()

        # fetch all (viewable) sections (collected form child_elements)
        labbooksections = LabbookSection.objects.viewable().filter(pk__in=labbooksection_pks). \
            prefetch_common().in_bulk()

        # fetch related comments
        related_left_comments = dict(
            (str(x['pk']), x['num_related_left_comments']) for x in
            Relation.objects.filter(
                Q(
                    Q(
                        right_content_type=picture_content_type_id,
                        right_object_id__in=pictures
                    ) | Q(
                        right_content_type=file_content_type_id,
                        right_object_id__in=files
                    ) | Q(
                        right_content_type=note_content_type_id,
                        right_object_id__in=notes
                    ) | Q(
                        right_content_type=plugin_instance_content_type_id,
                        right_object_id__in=plugin_instances
                    )
                ) & Q(
                    left_content_type=comment_content_type_id
                )
            ).order_by(
                'right_object_id', 'right_content_type'
            ).values(
                'right_object_id', 'right_content_type'
            ).annotate(
                num_related_left_comments=Count('left_object_id'),
                pk=F('right_object_id')
            ).values('pk', 'num_related_left_comments')
        )

        related_right_comments = dict(
            (str(x['pk']), x['num_related_right_comments']) for x in
            Relation.objects.filter(
                Q(
                    Q(
                        left_content_type=picture_content_type_id,
                        left_object_id__in=pictures
                    ) | Q(
                        left_content_type=file_content_type_id,
                        left_object_id__in=files
                    ) | Q(
                        left_content_type=note_content_type_id,
                        left_object_id__in=notes
                    ) | Q(
                        right_content_type=plugin_instance_content_type_id,
                        right_object_id__in=plugin_instances
                    )
                ) & Q(
                    right_content_type=comment_content_type_id
                )
            ).order_by(
                'left_object_id', 'left_content_type'
            ).values(
                'left_object_id', 'left_content_type'
            ).annotate(
                num_related_right_comments=Count('right_object_id'),
                pk=F('left_object_id')
            ).values('pk', 'num_related_right_comments')
        )

        # Performance Trick: iterate over child elements and set the child_object (else every element would be fetched
        # individually by a django rest serializer)
        for element in child_elements:
            if element.child_object_content_type_id == file_content_type_id:
                element.child_object = files.get(element.child_object_id, None)
            elif element.child_object_content_type_id == note_content_type_id:
                element.child_object = notes.get(element.child_object_id, None)
            elif element.child_object_content_type_id == picture_content_type_id:
                element.child_object = pictures.get(element.child_object_id, None)
            elif element.child_object_content_type_id == plugin_instance_content_type_id:
                element.child_object = plugin_instances.get(element.child_object_id, None)
            elif element.is_labbook_section:
                element.child_object = labbooksections.get(element.child_object_id, None)

            # only set num_related_comments and num_relations if a child_object is available
            if element.child_object and not element.is_labbook_section:
                element.num_related_comments = \
                    related_left_comments.get(str(element.child_object_id), 0) + \
                    related_right_comments.get(str(element.child_object_id), 0)

                element.num_relations = element.child_object.relations.count() - element.num_related_comments
            else:
                element.num_related_comments = 0
                element.num_relations = 0

        return child_elements


class LabBookViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    """ Handles LabBooks. """

    serializer_class = LabBookSerializer
    filterset_class = LabBookFilter
    search_fields = ()
    ordering_fields = ('title', 'created_at', 'created_by', 'last_modified_at', 'last_modified_by')

    def get_queryset(self):
        return LabBook.objects.viewable().prefetch_common(). \
            prefetch_related(
            'projects'
        )


class LabbookSectionViewSet(BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn,
                            LockableViewSetMixIn):
    """ Handles LabBook sections. """

    serializer_class = LabbookSectionSerializer
    filterset_class = LabbookSectionFilter
    search_fields = ()

    # pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        return LabbookSection.objects.viewable().prefetch_common().prefetch_related(
            'child_elements',
            'projects'
        )
