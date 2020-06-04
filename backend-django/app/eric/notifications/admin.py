#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" contains basic admin functionality for eric workbench notifications """
from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.postgres.forms import SimpleArrayField

from eric.notifications.models import NotificationConfiguration, Notification

User = get_user_model()


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'created_by',
        'created_at',
        'sent',
        'processed',
    )
    list_filter = (
        ('notification_type', admin.AllValuesFieldListFilter),
        ('processed', admin.BooleanFieldListFilter)
    )
    raw_id_fields = ('user',)
    search_fields = (
        'title',
        'message',
    )


class NotificationConfigurationAdminForm(forms.ModelForm):
    allowed_notifications = SimpleArrayField(forms.CharField(), widget=forms.Textarea)

    class Meta:
        fields = '__all__'
        model = NotificationConfiguration


@admin.register(NotificationConfiguration)
class NotificationConfigurationAdmin(admin.ModelAdmin):
    form = NotificationConfigurationAdminForm
    list_display = ('user',)
    raw_id_fields = ('user',)
    search_fields = (
        'user__email',
        'user__username',
        "user__userprofile__last_name",
    )
