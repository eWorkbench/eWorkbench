#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.template.loader import render_to_string

import pytz
from celery import shared_task

from eric.notifications.utils import send_mail
from eric.userprofile.models import UserProfile

User = get_user_model()
LOGGER = logging.getLogger(__name__)


@shared_task
def inactivate_user():
    inactivate_alum_user()
    inactivate_external_user()


def inactivate_alum_user():
    alum_user = UserProfile.objects.filter(affiliation_prim=UserProfile.ALUM)
    three_months_ago = datetime.now() - timedelta(days=90)
    utc = pytz.UTC
    for user_profile in alum_user:
        if user_profile.alum_timestamp < utc.localize(three_months_ago):
            user = user_profile.user
            user.is_active = False
            user.save()


def inactivate_external_user():
    users = User.objects.all()
    six_years_ago = datetime.now() - timedelta(days=365 * 6)

    utc = pytz.UTC
    for user in users:
        if user.groups.filter(name="External").exists() and user.is_active:
            if user.date_joined < utc.localize(six_years_ago + timedelta(days=1)):
                send_info_mail("1 day", user)
            elif user.date_joined < utc.localize(six_years_ago + timedelta(days=7)):
                send_info_mail("7 days", user)
            elif user.date_joined < utc.localize(six_years_ago + timedelta(days=30)):
                send_info_mail("30 days", user)
            if user.date_joined < utc.localize(six_years_ago):
                user.is_active = False
                user.save()


def send_info_mail(days, user):
    if user.email:
        username = user.username
        context = {"user": username, "days": days}
        html = render_to_string("email/external_user_inactivation_email.html", context)
        plaintext = render_to_string("email/external_user_inactivation_email.txt", context)
        try:
            send_mail(
                subject="Workbench account inactivation", message=plaintext, to_email=user.email, html_message=html
            )
        except Exception as exc:
            LOGGER.exception(exc)
