#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Create your views here.
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView


class IsAuthenticatedViews(APIView):
    """
    Simple REST API View that checks whether the current user is authenticated or not

    Needed for WebDav via NGINX
    """
    authentication_classes = (BasicAuthentication, SessionAuthentication)

    def get(self, request):
        print("Is authenticated :)")
        return Response({'auth': 'ok'})
