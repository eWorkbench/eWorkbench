#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from eric.contact_form.serializers import ContactFormSerializer
from eric.site_preferences.models import options as site_preferences

logger = logging.getLogger('eric.contact_form.views')


class ContactFormUserRateThrottle(UserRateThrottle):
    """limits the sending of contact forms to 10 per day and user"""
    rate = "10/day"
    cache_format = 'throttle_contact_form_%(scope)s_%(ident)s'


class SendContactForm(APIView):
    """ Custom API View for sending a contact form """

    serializer_class = ContactFormSerializer
    throttle_classes = (ContactFormUserRateThrottle,)

    def post(self, request, *args, **kwargs):
        """ Posts the contact form.  """

        if request.user.is_authenticated:
            # check if subject and message is filled
            serializer = self.serializer_class(data=request.data)
            serializer.is_valid(raise_exception=True)

            # send an e-mail to the contact admins
            context = {
                'subject': request.data['subject'],
                'message': request.data['message'],
                'workbench_url': request.data['url'],
                'backend_version': request.data['backend_version'],
                'browser_version': request.data['browser_version'],
                'user_local_time': request.data['local_time'],
                'server_time': timezone.now().isoformat(),
                'username': request.user.username,
                'user_str': str(request.user),
                'user_email': request.user.email,
                'ip_address': self.get_client_ip(request)
            }

            # send an e-mail to the contact admins
            msg = EmailMessage(
                subject=_("Contact form of {user_str}".format(user_str=str(request.user))),
                body=render_to_string('contact_form.html', context),
                from_email=site_preferences.email_from,
                to=settings.CONTACT_ADMIN,
                reply_to=[request.user.email],
            )
            msg.content_subtype = "html"
            try:
                msg.send()
            except Exception as exc:
                logger.exception(exc)

            # send an e-mail to the sender
            msg = EmailMessage(
                subject=_("Your contact form request"),
                body=render_to_string('contact_form_sender.html', context),
                from_email=site_preferences.email_from,
                to=[(str(request.user), request.user.email)],
            )
            msg.content_subtype = "html"
            try:
                msg.send()
            except Exception as exc:
                logger.exception(exc)

            # add log entry
            logger.debug(
                "{username}, {email}, '{subject}', {workbench_url}, '{browser_version}', {backend_version}, "
                "{user_local_time}, {server_time}, {ip_address}".format(
                    username=request.user.username,
                    email=request.user.email,
                    subject=request.data['subject'],
                    workbench_url=request.data['url'],
                    browser_version=request.data['browser_version'],
                    backend_version=request.data['backend_version'],
                    user_local_time=request.data['local_time'],
                    server_time=timezone.now().isoformat(),
                    ip_address=self.get_client_ip(request)
                )
            )

            return Response()

        return Response({'error': 'not logged in'}, status=status.HTTP_401_UNAUTHORIZED)

    @staticmethod
    def get_client_ip(request):
        """gets the ip address of the client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


send_contact_form = SendContactForm.as_view()
