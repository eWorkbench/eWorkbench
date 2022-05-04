#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.http import StreamingHttpResponse, HttpResponse
from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn
from eric.projects.models import Resource
from eric.projects.rest.filters import ResourceFilter
from eric.projects.rest.serializers import ResourceSerializer
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied


class ResourceViewSet(BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn,
                      ExportableViewSetMixIn, LockableViewSetMixIn):
    """ Viewset for resources """
    serializer_class = ResourceSerializer
    filterset_class = ResourceFilter
    search_fields = ()

    ordering_fields = ('name', 'type', 'description', 'location', 'created_by', 'contact', 'responsible_unit',
                       'general_usage_setting',)

    def get_queryset(self):
        """
         returns the queryset for ProjectRoleUserAssignment viewable objects,
         filtered by project primary (optional)
         """
        return Resource.objects.viewable().prefetch_common().prefetch_related('projects')

    @action(detail=True, methods=['GET'], url_path='terms-of-use-download', url_name='terms-of-use-download')
    def terms_of_use_download(self, request, *args, **kwargs):
        """
        Provides a detail route endpoint for downloading a terms of use pdf
        """
        # get all viewable resources for this user
        viewable_resources = Resource.objects.all().viewable()
        # get the resource
        resource = self.get_object()
        # check if the user has view permissions for this resource
        if viewable_resources.filter(pk=resource.pk).exists():
            # the path
            terms_of_use_path = resource.terms_of_use_pdf
            # create a file name for the header
            file_name = "Terms-of-Use-for-Resource-{}-{}.pdf".format(resource.name, resource.pk)
            # set up the response object
            response = StreamingHttpResponse(terms_of_use_path, content_type='application/pdf')
            # set filename in header
            response['Content-Disposition'] = 'attachment; filename="{}"'.format(file_name)
            return response
        # raise PermissionDenied if the user has no view permissions
        raise PermissionDenied
