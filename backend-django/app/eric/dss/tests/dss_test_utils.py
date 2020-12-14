#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

import os
from contextlib import AbstractContextManager
from os.path import abspath, join
from unittest.mock import patch

from eric.dss.config import DSS_MOUNT_PATH


def get_dss_mount_path(filename):
    return os.path.join(DSS_MOUNT_PATH, filename)


def create_file_in_dss_mount(filename, content='', create_directories=True):
    mount_path = get_dss_mount_path(filename)

    if create_directories:
        os.makedirs(os.path.dirname(mount_path), exist_ok=True)

    with open(mount_path, 'w') as file:
        file.write(content)


def delete_file_in_dss_mount(filename):
    mount_path = get_dss_mount_path(filename)
    os.remove(mount_path)


class TemporaryDSSFile(AbstractContextManager):
    def __init__(self, filename, content='', create_directories=True):
        self.filename = filename
        self.content = content
        self.create_directories = create_directories

    def __enter__(self):
        create_file_in_dss_mount(self.filename, self.content, self.create_directories)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        delete_file_in_dss_mount(self.filename)


def unsafe_join(base, *paths):
    """ django.utils._os.safe_join() without path checking. """

    return abspath(join(base, *paths))


def mocked_safe_join():
    """
    Shortcut to avoid SuspiciousFileOperation errors.

    Usage:
    with mocked_safe_join():
        ...
    """

    return patch('django.core.files.storage.safe_join', side_effect=unsafe_join)
