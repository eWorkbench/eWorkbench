#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from contextlib import contextmanager

from django.core.cache.backends.dummy import DummyCache


@contextmanager
def disable_django_caching(backend):
    """
    context manager that disables django caching by using a DummyCache in place of the current cache
    """

    old_cache = backend.cache

    # create new cache
    backend.cache = DummyCache("localhost", params={})

    try:
        yield
    finally:
        # enable old cache
        backend.cache = old_cache
