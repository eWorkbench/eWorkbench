#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.db import transaction
from django.http import HttpResponse

from rest_framework.exceptions import APIException

logger = logging.getLogger(__name__)


@transaction.atomic
def __gen_500_errors(request):
    with transaction.atomic():
        try:
            1 / 0
        except Exception as e:
            logger.exception(e)

    return HttpResponse("Hello 500!")


@transaction.atomic
def __raise_exception(request):
    raise APIException("Exception!")
