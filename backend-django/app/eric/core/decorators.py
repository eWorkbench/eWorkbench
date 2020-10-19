#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from contextlib import contextmanager

from django.core.cache.backends.dummy import DummyCache
from django.db import transaction


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


def on_transaction_commit(func):
    """
    Executes a function when a transaction is committed.
    Can be used in post_save signals to delay the handler until M2M fields are updated.
    Advisory: May conflict with tests, since usually there is nothing committed.
    Source: https://stackoverflow.com/questions/23795811/django-accessing-manytomany-fields-from-post-save-signal
    """

    def inner(*args, **kwargs):
        transaction.on_commit(lambda: func(*args, **kwargs))

    return inner
