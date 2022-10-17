#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
class Echo:
    """
    An object that implements just the write method of the file-like interface.
    """

    @staticmethod
    def write(value):
        """
        Write the value by returning it, instead of storing in a buffer.
        """
        return value
