#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.viewsets import GenericViewSet

from eric.cms.models import AcceptedScreen, Content, LaunchScreen
from eric.cms.rest.serializers import AcceptedScreenSerializer, LaunchScreenSerializer, MinimalContentSerializer
from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet, BaseAuthenticatedReadOnlyModelViewSet


class GetOnlyContentViewSet(RetrieveModelMixin, GenericViewSet):
    authentication_classes = ()
    permission_classes = ()
    serializer_class = MinimalContentSerializer
    queryset = Content.objects.all()
    lookup_field = "slug"


class GetOnlyLaunchScreenViewSet(BaseAuthenticatedReadOnlyModelViewSet):
    permission_classes = ()
    serializer_class = LaunchScreenSerializer

    def get_queryset(self):
        return LaunchScreen.objects.viewable()


class AcceptedScreenViewSet(BaseAuthenticatedModelViewSet):
    serializer_class = AcceptedScreenSerializer
    queryset = AcceptedScreen.objects.all()
