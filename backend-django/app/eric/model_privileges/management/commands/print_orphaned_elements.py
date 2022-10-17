#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils.timezone import localtime

from eric.core.models.abstract import get_workbench_models_with_special_permissions
from eric.core.templatetags.date_filters import date_short
from eric.model_privileges.models import ModelPrivilege

User = get_user_model()


class Command(BaseCommand):
    help = "Prints all Workbench elements where no Full Access privilege is granted to any user"

    def handle(self, *args, **options):
        print("Model\tPK\tCreatedBy\tCreatedAt\tLastModifiedBy\tLastModifiedAt\tHasAnyPrivileges")

        for model in get_workbench_models_with_special_permissions():
            model_name = str(model._meta)
            print("# " + model_name)

            objects_without_full_access_privilege = model.objects.exclude(
                model_privileges__full_access_privilege=ModelPrivilege.ALLOW
            )

            for obj in objects_without_full_access_privilege:
                created_at = date_short(localtime(obj.created_at))
                last_modified_at = date_short(localtime(obj.last_modified_at))
                has_privileges = obj.model_privileges.exists()

                print(
                    model_name
                    + "\t"
                    + str(obj.pk)
                    + "\t"
                    + obj.created_by.username
                    + "\t"
                    + created_at
                    + "\t"
                    + obj.last_modified_by.username
                    + "\t"
                    + last_modified_at
                    + "\t"
                    + str(has_privileges)
                )
