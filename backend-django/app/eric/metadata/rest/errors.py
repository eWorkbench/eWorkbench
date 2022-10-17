#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework.exceptions import ValidationError


class SearchParameterError(ValidationError):
    parameter_index = None

    def __init__(self, parameter_index, message):
        super().__init__(
            {
                str(parameter_index): [
                    message,
                ]
            }
        )


class InvalidFieldInputError(ValidationError):
    pass


class InvalidOperatorError(ValidationError):
    pass
