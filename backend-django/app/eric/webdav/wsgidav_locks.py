#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from uuid import uuid4

from eric.webdav.wsgidav_base_locks import BaseLock


class DummyLock(BaseLock):
    def get(self, *args, **kwargs):
        pass

    def acquire(self, *args, **kwargs):
        return str(uuid4())

    def release(self, token):
        return True

    def del_locks(self):
        pass
