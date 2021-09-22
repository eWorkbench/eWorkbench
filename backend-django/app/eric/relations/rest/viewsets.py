#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import NotFound
from rest_framework.pagination import LimitOffsetPagination

from eric.core.models.abstract import parse_parameters_for_workbench_models
from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet
from eric.relations.models import Relation
from eric.relations.rest.filters import RelationFilter
from eric.relations.rest.serializers import RelationSerializerExtended


class RelationViewSet(BaseAuthenticatedModelViewSet):
    """ Handles generic relations (links) between models. """

    serializer_class = RelationSerializerExtended

    # disable pagination for this endpoint
    # pagination_class = None
    pagination_class = LimitOffsetPagination

    ordering_fields = ('display', 'created_at', 'created_by')
    filterset_class = RelationFilter

    @staticmethod
    def get_parent_object_or_404(*args, **kwargs):
        """
        Tries to retrieve the parent object (defined via the REST API)
        Raises Http404 if we do not have access to the parent object
        """
        # parse arguments and return entity and primary key
        entity, pk, content_type = parse_parameters_for_workbench_models(*args, **kwargs)

        if not entity:
            # wrong entity specified
            raise Http404

        # get viewable queryset
        qs = entity.objects.viewable()

        return get_object_or_404(qs, pk=pk)

    def initial(self, request, *args, **kwargs):
        """
        Fetches the parent object and raises Http404 if the parent object does not exist (or the user does not have
        access to said object)
        """
        super(RelationViewSet, self).initial(request, *args, **kwargs)
        # store parent object
        self.parent = self.get_parent_object_or_404(*args, **kwargs)

    def get_object(self, *args, **kwargs):
        """
        Implement get_object with our own queryset (instead of using get_queryset)
        This is for performance / prefetch reasons
        """
        # Perform the lookup filtering.
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field

        assert lookup_url_kwarg in self.kwargs, ('Expected view %s to be called with a URL keyword argument '
                                                 'named "%s". Fix your URL conf, or set the `.lookup_field` '
                                                 'attribute on the view correctly.' %
                                                 (self.__class__.__name__, lookup_url_kwarg)
                                                 )

        # fetch relations using our "fast" get_relations prefetch logic
        obj = self.parent.get_relations([
            self.kwargs[lookup_url_kwarg]
        ]).first()

        if not obj:
            raise NotFound

        return obj

    def get_queryset(self):
        """
        Return the relations QuerySet, which is a property on the respective model
        :return:
        """

        if not hasattr(self, 'parent') or not self.parent:
            return Relation.objects.none()

        return self.parent.relations
