#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib import admin

from django_changeset.models import ChangeRecord
from django_rest_multitokenauth.models import MultiToken
from django_rest_passwordreset.models import ResetPasswordToken


class ChangeRecordAdmin(admin.ModelAdmin):
    list_display = [field.name for field in ChangeRecord._meta.get_fields()]
    search_fields = (
        "id",
        "new_value",
        "old_value",
        "field_name",
    )
    list_per_page = 20


admin.site.unregister(ChangeRecord)
admin.site.register(ChangeRecord, ChangeRecordAdmin)


class MultiTokenTokenAdmin(admin.ModelAdmin):
    list_display = [field.name for field in MultiToken._meta.get_fields()]
    search_fields = (
        "id",
        "key",
        "last_known_ip",
        "user__username",
        "user__email",
        "user__userprofile__last_name",
        "user_agent",
    )


admin.site.unregister(MultiToken)
admin.site.register(MultiToken, MultiTokenTokenAdmin)


class ResetPasswordTokenAdmin(admin.ModelAdmin):
    list_display = [field.name for field in ResetPasswordToken._meta.get_fields()]
    search_fields = (
        "ip_address",
        "user_agent",
        "user__email",
        "user__username",
        "user__userprofile__last_name",
    )


admin.site.unregister(ResetPasswordToken)
admin.site.register(ResetPasswordToken, ResetPasswordTokenAdmin)
