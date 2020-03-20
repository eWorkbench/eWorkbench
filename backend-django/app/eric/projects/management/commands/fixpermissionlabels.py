#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission


class Command(BaseCommand):
    """
    In case you update the labels/titles of a permission in your model, you need to run this command to make sure those
    updates are also reflected within the database
    """
    help = 'Update permission labels'

    def handle(self, *args, **options):
        # iterate over all permissions
        for permission in Permission.objects.all():
            # get model class
            model_class = permission.content_type.model_class()

            if not model_class:
                continue

            # check model class meta permissions
            if len(model_class._meta.permissions) != 0:
                model_permissions = dict(model_class._meta.permissions)
                # if the codename of the permission is within the model permissions, it is a custom permission
                if permission.codename in model_permissions:
                    # and a custom permission has a readable text
                    human_readable_text = model_permissions[permission.codename]

                    # finally, check whether the human readable text has changed
                    if permission.name != human_readable_text:
                        # has changed -> update it
                        print('Updating permission', permission, ' with new text:', human_readable_text)
                        permission.name = human_readable_text
                        permission.save()
