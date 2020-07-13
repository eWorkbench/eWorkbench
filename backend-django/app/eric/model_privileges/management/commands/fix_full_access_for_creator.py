#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils.timezone import localtime

from eric.core.models import disable_permission_checks
from eric.core.models.abstract import get_workbench_models_with_special_permissions
from eric.core.templatetags.date_filters import date_short
from eric.model_privileges.models import ModelPrivilege

User = get_user_model()


class Command(BaseCommand):
    help = """
    Gives the Full Access Privilege to the creator of elements where no Full Access Privilege is present for any user.
    Prints the elements where privileges have been granted.
    """

    def add_arguments(self, parser):
        parser.add_argument(
            '--creator',
            type=str,
            default=None,
            help='Limits the command to a specific creator (username)'
        )

        parser.add_argument(
            '--dry-run',  # stored as dry_run
            action='store_true',
            help='Prints the result but does not perform the action'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        creator_username = options['creator']

        if dry_run:
            print('# DRY RUN')

        print('Model\tPK\tCreatedBy\tCreatedAt\tLastModifiedBy\tLastModifiedAt')

        for model in get_workbench_models_with_special_permissions():
            model_name = str(model._meta)
            print('# ' + model_name)

            objects_without_full_access_privilege = self.get_objects_without_full_access_privilege(
                model, creator_username
            )

            for obj in objects_without_full_access_privilege:
                creator = obj.created_by

                if not dry_run:
                    self.grant_full_access_privilege(obj, creator)

                self.print_object(model_name, obj)

    @classmethod
    def get_objects_without_full_access_privilege(cls, model, creator_username):
        qs = model.objects.exclude(model_privileges__full_access_privilege=ModelPrivilege.ALLOW)

        if creator_username:
            qs = qs.filter(created_by__username=creator_username)

        return qs

    @classmethod
    def grant_full_access_privilege(cls, obj, user):
        privileges = obj.model_privileges.filter(user=user).first()
        if not privileges:
            privileges = ModelPrivilege(
                user=user,
                content_type=obj.get_content_type(),
                object_id=obj.pk
            )

        privileges.full_access_privilege = ModelPrivilege.ALLOW

        with disable_permission_checks(ModelPrivilege):
            privileges.save()

    @classmethod
    def print_object(cls, model_name, obj):
        created_at = date_short(localtime(obj.created_at))
        last_modified_at = date_short(localtime(obj.last_modified_at))
        print(
            model_name + '\t' +
            str(obj.pk) + '\t' +
            obj.created_by.username + '\t' +
            created_at + '\t' +
            obj.last_modified_by.username + '\t' +
            last_modified_at + '\t'
        )
