#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#


class DavAcl:
    """Represents all the permissions that a user might have on a resource. This
    makes it easy to implement virtual permissions."""

    def __init__(self, read=False, write=False, delete=False, full=None):
        if full is not None:
            self.read = self.write = self.delete = self.create = self.relocate = full
        self.read = read
        self.write = write
        self.delete = delete


class ReadOnlyAcl(DavAcl):
    def __init__(self, read=True, write=False, delete=False, full=None):
        super().__init__(read, write, delete, full)


class FullAcl(DavAcl):
    def __init__(self, read=True, write=True, delete=True, full=None):
        super().__init__(read, write, delete, full)
