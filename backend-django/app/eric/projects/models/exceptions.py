#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#


class UserStorageLimitReachedException(Exception):
    """
    Raised when the user wants to upload a file and the user storage would be reached.
    """

    def __init__(self, available_storage, *args, **kwargs):
        super(UserStorageLimitReachedException, self).__init__(*args, **kwargs)
        self.available_storage = available_storage


class MaxFileSizeReachedException(Exception):
    """
    Raised when the user wants to upload a file that is larger than the max file size defined in site preferences
    """

    def __init__(self, max_file_size, *args, **kwargs):
        super(MaxFileSizeReachedException, self).__init__(*args, **kwargs)
        self.max_file_size = max_file_size
