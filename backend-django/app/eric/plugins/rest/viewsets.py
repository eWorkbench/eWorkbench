#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from distutils import util

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.http import HttpResponse, Http404
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.datastructures import MultiValueDictKeyError
from django.utils.translation import gettext_lazy as _
from django_userforeignkey.request import get_current_user
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from eric.core.models.utils import build_download_response
from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn
from eric.plugins.models.models import Plugin, PluginInstance
from eric.plugins.rest.filters import PluginInstanceFilter, PluginFilter
from eric.plugins.rest.permissions import HasPluginAccess
from eric.plugins.rest.serializers import PluginSerializer, PluginInstanceSerializer, PluginFeedbackSerializer
from eric.projects.models import MyUser
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn
from eric.site_preferences.models import options as site_preferences


class PluginViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    """ REST API Viewset for plugins """
    http_method_names = ['get', 'head', 'post']
    serializer_class = PluginSerializer
    filter_class = PluginFilter
    search_fields = ['title', 'short_description']
    ordering_fields = ('title',)

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        """
        returns the queryset for Plugin viewable objects,
        filtered by project primary (optional)
        """

        try:
            # turn query parameter to a proper boolean
            only_plugins_with_access = util.strtobool(
                self.request.GET['onlyPluginsWithAccess']
            )
        except MultiValueDictKeyError:
            # make sure that the default fallback is viewable(),
            # i.e. only plugins which the current user has access to
            only_plugins_with_access = True

        if only_plugins_with_access:
            return Plugin.objects.viewable()
        else:
            return Plugin.objects.all()

    def create(self, request, *args, **kwargs):
        """
        Ensure only superusers can create new plugins
        """
        user = get_current_user()
        if user.is_anonymous:
            return HttpResponse(status=status.HTTP_403_FORBIDDEN)
        elif user.is_superuser:
            return super(PluginViewSet, self).create(request, *args, **kwargs)

    @action(detail=True,
            methods=['GET'],
            url_path='picture.png',
            url_name='placeholder-picture')
    def download_placeholder_picture(self, request, format=None, *args, **kwargs):
        """ Provides a detail route endpoint for downloading the placeholder picture """
        pk = kwargs.get('pk')
        plugin = Plugin.objects.get(pk=pk)
        return build_download_response(plugin, plugin.placeholder_picture)

    @staticmethod
    def create_and_send_mail(context, type):
        # render email text (as plaintext and html)
        if type == 'request_access':
            email_html_message = render_to_string('email/request_plugin_access.html', context)
            email_plaintext_message = render_to_string('email/request_plugin_access.txt', context)
        else:
            email_html_message = render_to_string('email/plugin_feedback.html', context)
            email_plaintext_message = render_to_string('email/plugin_feedback.txt', context)

        msg = EmailMultiAlternatives(
            subject=_("{title} Plugins: {subject} ".format(
                title=site_preferences.site_name,
                subject=context['subject'])
            ),
            body=email_plaintext_message,
            from_email=site_preferences.email_from,
            to=[context['recipient_email']]
        )
        msg.attach_alternative(email_html_message, "text/html")
        msg.send()

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def feedback(self, request, *args, **kwargs):
        """ Endpoint for sending feedback or requesting access to a plugin
        """
        serializer = PluginFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # get subject and message
        subject = request.data['subject']
        message = request.data['message']
        plugin_pk = request.data['pluginPk']
        feedback_type = request.data['type']

        # get plugin details
        plugin = Plugin.objects.get(pk=plugin_pk)
        plugin_admin_url = request.build_absolute_uri(
            reverse('admin:plugins_plugin_change', args=(plugin.pk,))
        )

        # get requesting user
        current_user = get_current_user()
        current_user.__class__ = MyUser

        context = {
            'requesting_username': current_user.username,
            'plugin_title': plugin.title,
            'plugin_admin_url': plugin_admin_url,
            'subject': subject,
            'message': message,
        }

        # get recipients of mail
        recipient_list = plugin.responsible_users.all()

        for recipient in recipient_list:
            context['recipient_username'] = recipient.username
            context['recipient_email'] = recipient.email
            # send an e-mail to each recipient
            self.create_and_send_mail(context, feedback_type)

        # an additional mail is sent to CONTACT_ADMIN

        for admin_contact in settings.CONTACT_ADMIN:
            context['recipient_username'] = admin_contact[0]
            context['recipient_email'] = admin_contact[1]

            self.create_and_send_mail(context, feedback_type)

        # done!
        return Response(status=status.HTTP_200_OK)


class PluginInstanceViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    serializer_class = PluginInstanceSerializer
    filter_class = PluginInstanceFilter
    permission_classes = (IsAuthenticated, HasPluginAccess,)
    search_fields = ()

    def get_queryset(self):
        return PluginInstance.objects.viewable().prefetch_common().prefetch_related('projects')

    @action(detail=True,
            methods=['GET'],
            url_path='rawdata',
            url_name='rawdata')
    def download_rawdata(self, request, format=None, *args, **kwargs):
        """ Provides a detail route endpoint for downloading the rawdata """
        pk = kwargs.get('pk')
        plugin_instance = PluginInstance.objects.viewable().filter(pk=pk).first()
        if not plugin_instance:
            raise Http404

        return build_download_response(plugin_instance.rawdata_mime_type, plugin_instance.rawdata)

    @action(detail=True,
            methods=['GET'],
            url_path='picture.png',
            url_name='picture')
    def download_picture(self, request, format=None, *args, **kwargs):
        """ Provides a detail route endpoint for downloading the picture """
        pk = kwargs.get('pk')
        plugin_instance = PluginInstance.objects.viewable().filter(pk=pk).first()
        if not plugin_instance:
            raise Http404

        plugin_instance = PluginInstance.objects.get(pk=pk)
        return build_download_response(plugin_instance.picture_mime_type, plugin_instance.picture)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # we need to check, if the current user is allowed to use the referenced plugin
        plugin_pk = request.data['plugin']
        plugin = Plugin.objects.usable().filter(pk=plugin_pk).first()
        if not plugin:
            raise PermissionDenied(_('Plugin is not accessible for user'))

        self.check_object_permissions(request, plugin)
        return super(PluginInstanceViewSet, self).create(request, *args, **kwargs)
