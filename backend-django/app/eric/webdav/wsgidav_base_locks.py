#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#


class BaseLock:
    def __init__(self, resource):
        self.resource = resource

    def get(self):
        """Gets all active locks for the requested resource. Returns a list of locks."""
        raise NotImplementedError()

    def acquire(self, lockscope, locktype, depth, timeout, owner):
        """Creates a new lock for the given resource."""
        raise NotImplementedError()

    def release(self, token):
        """Releases the lock referenced by the given lock id."""
        raise NotImplementedError()

    def del_locks(self):
        """Releases all locks for the given resource."""
        raise NotImplementedError()
