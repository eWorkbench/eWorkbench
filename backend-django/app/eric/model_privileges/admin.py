#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.admin import GenericTabularInline
from django.utils.translation import gettext_lazy as _

from eric.core.admin.is_deleteable import DeleteableModelAdmin
from eric.model_privileges.models import ModelPrivilege

User = get_user_model()


@admin.register(ModelPrivilege)
class ModelPrivilegeAdmin(DeleteableModelAdmin):
    model = ModelPrivilege
    list_display = (
        'user',
        'content_type',
        'content_object',
        'full_access_privilege',
        'view_privilege',
    )
    list_filter = (
        'full_access_privilege',
        'view_privilege',
        'edit_privilege',
        'delete_privilege',
        'restore_privilege',
    )
    search_fields = (
        'user__username',
        'user__email',
        'content_type__app_label',
        'content_type__model',
    )
    raw_id_fields = ('user',)
    list_per_page = 20


class ModelPrivilegeInline(GenericTabularInline):
    model = ModelPrivilege
    verbose_name = _('Privilege')
    verbose_name_plural = _('Privileges')
    raw_id_fields = ('user',)
    extra = 1
