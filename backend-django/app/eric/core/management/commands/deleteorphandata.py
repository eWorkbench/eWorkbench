#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

import logging
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db.models import Q
from django.db.models.signals import post_delete, pre_delete

import pytz
from django_changeset.models.models import ChangeRecord, ChangeSet

from eric.caldav.models import CaldavItem
from eric.core.models import DisableSignal, disable_permission_checks
from eric.dmp.models import Dmp
from eric.drives.models import Directory, Drive
from eric.kanban_boards.models import KanbanBoard
from eric.labbooks.models import LabBook
from eric.model_privileges.models import ModelPrivilege
from eric.model_privileges.models.handlers import disallow_delete_of_last_full_access_privilege
from eric.model_privileges.utils import get_model_privileges_and_project_permissions_for
from eric.notifications.models import ScheduledNotification
from eric.pictures.models import Picture
from eric.projects.models import Project, ProjectRoleUserAssignment, Resource
from eric.projects.models.handlers import prevent_delete_of_project_manager
from eric.shared_elements.models import Contact, File, Meeting, Note, Task, TaskAssignedUser, UserAttendsMeeting
from eric.userprofile.models import UserProfile

User = get_user_model()

LOGGER = logging.getLogger(__name__)


class Command(BaseCommand):
    models = [
        KanbanBoard,
        LabBook,
        Task,
        Contact,
        Picture,
        File,
        Resource,
        Meeting,
        Drive,
        Dmp,
        ScheduledNotification,
        Note,
    ]

    disable_permission_models = [
        TaskAssignedUser,
        ModelPrivilege,
        ChangeSet,
        ChangeRecord,
        ProjectRoleUserAssignment,
        UserAttendsMeeting,
        CaldavItem,
        Directory,
    ]

    disable_signals = [
        DisableSignal(post_delete, disallow_delete_of_last_full_access_privilege, ModelPrivilege),
        DisableSignal(pre_delete, prevent_delete_of_project_manager, ProjectRoleUserAssignment),
    ]

    def handle(self, *args, **options):
        self.with_permissions_disabled(self.delete_orphan_data)
        self.with_permissions_disabled(self.delete_trashed_data)

    def with_permissions_disabled(self, function, models_index=0, signals_index=0):
        if models_index < len(self.disable_permission_models):
            with disable_permission_checks(self.disable_permission_models[models_index]):
                self.with_permissions_disabled(function, models_index + 1, signals_index)
        elif signals_index < len(self.disable_signals):
            with self.disable_signals[signals_index]:
                self.with_permissions_disabled(function, models_index, signals_index + 1)
        else:
            function()

    def delete_orphan_data(self):
        user_profiles = UserProfile.objects.filter(anonymized=True)
        six_months_ago = datetime.now() - timedelta(days=183)
        utc = pytz.UTC
        for user_profile in user_profiles:
            for model in self.models:
                data = model.objects.filter(created_by_id=user_profile.user, deleted=False)
                for row in data:
                    model_privileges = get_model_privileges_and_project_permissions_for(model, row)
                    privileges_of_other_user = []
                    for model_privilege in model_privileges:
                        if model_privilege.user != user_profile.user:
                            if (
                                model_privilege.full_access_privilege == ModelPrivilege.ALLOW
                                or model_privilege.view_privilege == ModelPrivilege.ALLOW
                            ):
                                privileges_of_other_user.append(model_privilege)
                    if len(privileges_of_other_user) < 1 and row.last_modified_at < utc.localize(six_months_ago):
                        with disable_permission_checks(model):
                            row.delete()
                            LOGGER.info(
                                "Deleted orphan data (<{data}> - <{name}>) of user <{username}>".format(
                                    data=model.__name__, name=row.__str__, username=user_profile.user.username
                                )
                            )

    def delete_trashed_data(self):
        ten_years_ago = datetime.now() - timedelta(days=10 * 365)
        utc = pytz.UTC
        for model in self.models:
            data = model.objects.filter(deleted=True)
            for row in data:
                if row.last_modified_at < utc.localize(ten_years_ago):
                    with disable_permission_checks(model):
                        row.delete()
                        LOGGER.info(f"Deleted trashed data (<{model.__name__}> - <{row.__str__}>)")
