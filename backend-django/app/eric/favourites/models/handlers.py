#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.db.models.signals import post_delete
from django.dispatch.dispatcher import receiver

from eric.core.models import disable_permission_checks
from eric.favourites.models import Favourite


@receiver(post_delete)
def on_delete_element_delete_favourites(sender, instance, *args, **kwargs):
    """ Signal that handles delete of an object
    All favourites that use this object need to be deleted too
    !!! Note: objects should never be deleted;
    !!! This receiver is only meant as a fallback, to make sure database favourites are kept intact when a superuser
        deletes anything in the database (via django admin)
    """

    # ignore all non-favouritable models
    meta_class = instance._meta
    if not hasattr(meta_class, 'is_favouritable') or not meta_class.is_favouritable:
        return

    favourites = Favourite.objects.filter(
        object_id=instance.pk,
        content_type=instance.get_content_type()
    )

    if favourites.exists():
        with disable_permission_checks(Favourite):
            favourites.delete()
