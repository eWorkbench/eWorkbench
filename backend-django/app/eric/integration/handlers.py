#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _
from django_userforeignkey.request import get_current_user
from rest_framework.exceptions import PermissionDenied

from eric.core.models import permission_checks_disabled
from eric.dmp.models import Dmp
from eric.drives.models import Drive
from eric.kanban_boards.models import KanbanBoard
from eric.labbooks.models import LabBook
from eric.pictures.models import Picture
from eric.plugins.models import PluginInstance
from eric.projects.models import Project, Resource
from eric.shared_elements.models import Task, Meeting, Contact, Note, File

models_only_superuser_can_delete = (
    Project,
    LabBook,
    Task,
    Meeting,
    Contact,
    Note,  # aka Comment
    Drive,  # aka Storage
    Picture,
    File,
    Resource,
    KanbanBoard,  # aka TaskBoard
    Dmp,
    PluginInstance,
)


@receiver(pre_delete)
def make_sure_workbench_entities_are_not_deleted_by_normal_users(instance, *args, **kwargs):
    """
    Only superusers may delete workbench entities. Normal users may trash only.
    """

    # not a protected model -> let the request through
    if not isinstance(instance, models_only_superuser_can_delete):
        return

    # nothing to do if permission checks are disabled
    if permission_checks_disabled(instance):
        return

    # check if user is superuser
    user = get_current_user()
    if not user.is_superuser:
        model_name = str(type(instance))
        raise PermissionDenied(_("Only admins can delete {model} objects").format(model=model_name))
