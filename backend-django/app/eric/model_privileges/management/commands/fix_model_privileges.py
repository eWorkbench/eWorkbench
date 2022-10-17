#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.db.models import Count

from eric.core.models.base import disable_permission_checks
from eric.model_privileges.models import ModelPrivilege

User = get_user_model()


class Command(BaseCommand):
    help = "Management command for fixing entities without permissions"

    def add_arguments(self, parser):
        # add an argument that lists all entities with invalid permissions
        parser.add_argument(
            "--list", action="store_true", dest="list", default=True, help="List all entities with invalid permissions"
        )

        parser.add_argument("entity_name", type=str, help="The entity that needs to be checked (e.g., Task)")

        parser.add_argument(
            "user_id", type=int, nargs="?", help="User Id that should be used for entity permission assignment"
        )

    def handle(self, *args, **options):
        # find entity name in content type
        cts = ContentType.objects.filter(model__iexact=options["entity_name"])

        ct = None

        if cts.exists():
            if cts.count() == 1:
                print(f"Found entity {cts[0]}")
                ct = cts[0]
            else:
                print("Please specify entity - Found the following entities:")
                for ct in cts:
                    print(ct)
                    exit(-3)
        else:
            print("Could not find entity, exiting...")
            exit(-2)

        model = ct.model_class()

        if not hasattr(model._meta, "can_have_special_permissions") or not model._meta.can_have_special_permissions:
            print("Error: Meta Class Attribute 'can_have_special_permissions' needs to be true")
            exit(-1)

        if options["list"]:
            # get total count
            total_count = model.objects.all().count()

            objects = model.objects.annotate(number_model_privileges=Count("model_privileges")).filter(
                number_model_privileges=0
            )

            print(
                "{ct}: {num_objects} of {total_count_objects} found without entity permission".format(
                    ct=ct, num_objects=objects.count(), total_count_objects=total_count
                )
            )

            for o in objects:
                print(f" - {o}")

            if options["user_id"]:
                # fix all those objects

                user = User.objects.get(pk=options["user_id"])

                print(f"Assigning those objects to user {user}")

                with disable_permission_checks(ct):
                    for o in objects:
                        perm = ModelPrivilege(
                            user=user, full_access_privilege=ModelPrivilege.ALLOW, content_type=ct, object_id=o.id
                        )
                        perm.save()

                # try again
                objects = model.objects.annotate(number_model_privileges=Count("model_privileges")).filter(
                    number_model_privileges=0
                )

                print(
                    "{ct}: {num_objects} (should be 0) of {total_count_objects} found without entity permission".format(
                        ct=ct, num_objects=objects.count(), total_count_objects=total_count
                    )
                )
