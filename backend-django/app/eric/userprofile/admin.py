#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import time

from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.core.exceptions import ObjectDoesNotExist
from django.db import connection
from django.db.models import Prefetch, Q
from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.template.loader import get_template
from django.template.response import TemplateResponse
from django.urls import reverse, re_path
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils.translation import gettext as _
from django_changeset.models import ChangeSet
from django_rest_passwordreset.models import ResetPasswordToken

from eric.projects.models import MyUser
from eric.userprofile.forms import UserProfileForm
from eric.userprofile.models import UserProfile

User = get_user_model()
logger = logging.getLogger(__name__)


class UserProfileInline(admin.StackedInline):
    """ The inline user model """
    model = UserProfile
    can_delete = False
    verbose_name = 'User Profile Information'
    verbose_name_plural = 'User Profile Information'
    form = UserProfileForm


class UserAdmin(BaseUserAdmin):
    """ Setting the inline user model to the user admin"""
    inlines = (UserProfileInline,)
    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
        'user_groups',
        'is_staff',
        'user_actions',
    )
    readonly_fields = (
        'user_actions',
        'user_groups',
    )

    def user_groups(self, obj):
        return ', '.join([str(group) for group in obj.groups.all()])

    def get_urls(self):
        """ Adds a custom URL for action-buttons """
        urls = super().get_urls()
        custom_urls = [
            re_path(
                r'^export-user-data/(?P<user_pk>[0-9]+)$',
                self.admin_site.admin_view(self.export_personal_data),
                name='export-user-data',
            ),
            re_path(
                r'^anonymize/(?P<user_pk>[0-9]+)$',
                self.admin_site.admin_view(self.anonymize_user),
                name='anonymize-user',
            )
        ]
        return urls + custom_urls

    def user_actions(self, obj):
        """ Renders the HTML for action-buttons """
        export_user_data = format_html(
            '<a class="button" href="{}">{}</a>',
            reverse('admin:export-user-data', args=[obj.pk]),
            _('Export Personal Data'),
        )

        anonymize_user = format_html(
            '<a class="button" href="{}">{}</a>',
            reverse('admin:anonymize-user', args=[obj.pk]),
            _('Anonymize User'),
        )

        return mark_safe(' '.join([
            export_user_data,
            anonymize_user
        ]))

    user_actions.short_description = 'Actions'
    user_actions.allow_tags = True

    @staticmethod
    def export_personal_data(request, user_pk, *args, **kwargs):
        logger.info("Starting personal data export for user {}".format(user_pk))

        from eric.drives.models import Drive
        from eric.labbooks.models import LabBook
        from eric.pictures.models import Picture
        from eric.shared_elements.models import Task, Note, Meeting, Contact, File

        start_time = time.perf_counter()

        # TODO: Find better way to read all data efficiently
        # prefetch data -- sadly this has little impact:
        user = User.objects.filter(pk=user_pk).select_related(
            'userprofile',
            'user_storage_limit',
            'notification_configuration',
        ).prefetch_related(
            'userstoragelimit_created',
            'userstoragelimit_modified',
            'relation_created',
            'relation_modified',
            Prefetch('note_created', queryset=Note.objects.all().prefetch_common()),
            Prefetch('note_modified', queryset=Note.objects.all().prefetch_common()),
            'elementlabel_created',
            'elementlabel_modified',
            Prefetch('meeting_created', queryset=Meeting.objects.all().prefetch_common()),
            Prefetch('meeting_modified', queryset=Meeting.objects.all().prefetch_common()),
            Prefetch('contact_created', queryset=Contact.objects.all().prefetch_common()),
            Prefetch('contact_modified', queryset=Contact.objects.all().prefetch_common()),
            'contactattendsmeeting_created',
            'contactattendsmeeting_modified',
            'uploadedfileentry_created',
            'uploadedfileentry_modified',
            'uploadedpictureentry_created',
            'uploadedpictureentry_modified',
            Prefetch('drive_created', queryset=Drive.objects.all().prefetch_common()),
            Prefetch('drive_modified', queryset=Drive.objects.all().prefetch_common()),
            'notification_created',
            'notification_modified',
            'notificationconfiguration_created',
            'notificationconfiguration_modified',
            Prefetch('file_created', queryset=File.objects.all().prefetch_common()),
            Prefetch('file_modified', queryset=File.objects.all().prefetch_common()),
            'version_created',
            'version_modified',
            'auth_tokens',
            Prefetch('picture_created', queryset=Picture.objects.all().prefetch_common()),
            Prefetch('picture_modified', queryset=Picture.objects.all().prefetch_common()),
            'role_created',
            'role_modified',
            'content_created',
            'content_modified',
            'rolepermissionassignment_created',
            'rolepermissionassignment_modified',
            'metadata_created',
            'metadata_modified',
            Prefetch('task_created', queryset=Task.objects.all().prefetch_common()),
            Prefetch('task_modified', queryset=Task.objects.all().prefetch_common()),
            'taskassigneduser_created',
            'taskassigneduser_modified',
            'taskchecklist_created',
            'taskchecklist_modified',
            'metadatafield_created',
            'metadatafield_modified',
            'userattendsmeeting_created',
            'userattendsmeeting_modified',
            'modelprivilege_created',
            'modelprivilege_modified',
            Prefetch('labbook_created', queryset=LabBook.objects.all().prefetch_common()),
            Prefetch('labbook_modified', queryset=LabBook.objects.all().prefetch_common()),
        ).first()

        if not user:
            raise Http404

        context = {
            "user": user,
            "reset_password_token": ResetPasswordToken.objects.filter(user=user),
            "change_sets": ChangeSet.objects.filter(user=user).prefetch_related('change_records'),
        }
        template = get_template('export/personal_data.html')

        # this is were the data hits hard with > 4000 queries
        response = HttpResponse(
            template.render(context, request),
            content_type='application/html'
        )

        logger.info("Finished personal data export in {} sec.".format(time.perf_counter() - start_time))
        logger.info("Queries: {}".format(len(connection.queries)))

        filename = "personal-data-export-{username}.html".format(username=user.username)
        response['Content-Disposition'] = 'filename="{}"'.format(filename)

        return response

    def anonymize_user(self, request, user_pk, *args, **kwargs):
        """Starts the process of anonymizing the selected user after a two-step confirmation"""
        try:
            user = MyUser.objects.get(pk=user_pk)
        except ObjectDoesNotExist:
            self.message_user(request, _("The requested user could not be found"), level=messages.ERROR)
            return HttpResponseRedirect(reverse('admin:auth_user_changelist'))

        if request.method == 'POST':
            try:
                user.anonymize_user_data()
                user.anonymize_userprofile_data()

                self.message_user(request, _("User %(user)s has been anonymized") % {
                    'user': user
                }, level=messages.SUCCESS)
            except Exception as error:
                self.message_user(request, _("User %(user)s could not be anonymized: %(error)s") % {
                    'user': user,
                    'error': error
                }, level=messages.ERROR)

            return HttpResponseRedirect(reverse('admin:auth_user_changelist'))

        context = self.admin_site.each_context(request)
        context['opts'] = self.model._meta
        context['user'] = user

        return TemplateResponse(
            request,
            'admin/userprofile/anonymize_user.html',
            context=context
        )


# Re-registering the admin stuff with our user admin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
