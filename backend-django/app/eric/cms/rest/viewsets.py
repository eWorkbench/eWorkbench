#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.viewsets import GenericViewSet

from eric.cms.models import Content
from eric.cms.rest.serializers import MinimalContentSerializer


class GetOnlyContentViewSet(RetrieveModelMixin, GenericViewSet):
    authentication_classes = ()
    permission_classes = ()
    serializer_class = MinimalContentSerializer
    queryset = Content.objects.all()
    lookup_field = 'slug'
