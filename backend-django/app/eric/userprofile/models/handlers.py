#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
from datetime import datetime

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from django.core.mail import EmailMultiAlternatives
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from django_rest_passwordreset.signals import reset_password_token_created
from django_userforeignkey.request import get_current_user

from eric.jwt_auth.jwt_utils import generate_random_jwt_verification_token
from eric.notifications.utils import send_mail
from eric.projects.models.models import MyUser, ProjectRoleUserAssignment
from eric.shared_elements.models.models import TaskAssignedUser, UserAttendsMeeting
from eric.site_preferences.models import options as site_preferences
from eric.userprofile.models.models import UserProfile

LDAP_LOGGER = logging.getLogger("eric.ldap")
LOGGER = logging.getLogger(__name__)

User = get_user_model()


@receiver(pre_save, sender=UserProfile)
def save_alum_timestamp(sender, instance, *args, **kwargs):
    try:
        old_instance = UserProfile.objects.get(id=instance.id)
    except UserProfile.DoesNotExist:  # to handle initial object creation
        old_instance = None

    if old_instance:
        if old_instance.affiliation_prim != UserProfile.ALUM:
            if instance.affiliation_prim == UserProfile.ALUM:
                instance.alum_timestamp = datetime.now()
        elif instance.affiliation_prim != UserProfile.ALUM:
            instance.alum_timestamp = None
            user = instance.user
            user.is_active = True
            user.save()


@receiver(pre_save, sender=User)
def save_inactive_timestamp(sender, instance, *args, **kwargs):
    try:
        old_instance = User.objects.get(id=instance.id)
    except User.DoesNotExist:
        old_instance = None

    if old_instance:

        if old_instance.is_active:
            if not instance.is_active:
                user_profile = instance.userprofile
                user_profile.inactivated_at = datetime.now()
                user_profile.save()
                send_is_active_info_mail_to_user("Workbench account deactivated", instance, instance.is_active)
        elif instance.is_active:
            user_profile = instance.userprofile
            user_profile.inactivated_at = None
            user_profile.save()
            send_is_active_info_mail_to_user("Workbench account activated", instance, instance.is_active)


@receiver(post_save, sender=User)
def check_for_save_on_ldap_user(instance, created, *args, **kwargs):
    """
    When a user is created from LDAP, we need to do the initial sync
    :return:
    """
    if hasattr(instance, "ldap_user"):
        create_user_profile_ldap(instance, instance.ldap_user, *args, **kwargs)
        assign_ldap_user_group(instance, instance.ldap_user, *args, **kwargs)


def send_is_active_info_mail_to_user(title, user, is_active):
    if user.email:
        username = user.username
        status = "inactive"
        if user.first_name and user.last_name:
            username = f"{user.first_name} {user.last_name}"
        if is_active:
            status = "active"
        context = {
            "user": username,
            "status": status,
        }
        html = render_to_string("email/is_active_email.html", context)
        plaintext = render_to_string("email/is_active_email.txt", context)
        try:
            send_mail(subject=title, message=plaintext, to_email=user.email, html_message=html)
        except Exception as exc:
            LOGGER.exception(exc)


def create_user_profile_ldap(user, ldap_user, *args, **kwargs):
    """Automatically create user profile and update ldap users profile"""

    user_profile = get_or_create_userprofile(user)

    # update ldap user profile - read attribute map from settings
    from django.conf import settings

    if hasattr(settings, "AUTH_LDAP_PROFILE_ATTR_MAP"):
        sync_mapped_ldap_attributes(settings.AUTH_LDAP_PROFILE_ATTR_MAP, user_profile, ldap_user)

    user_profile.type = UserProfile.LDAP_USER
    user_profile.save()


def get_or_create_userprofile(user):
    try:
        return user.userprofile
    except Exception:
        # user profile does not exist yet
        return UserProfile(user=user)


def sync_mapped_ldap_attributes(attribute_map, user_profile, ldap_user):
    user = user_profile.user

    # Hint: LDAP does not send attributes with empty values.

    # check if any mapped attributes are missing => log info otherwise
    missing_attributes = [attr for attr in attribute_map.values() if attr not in ldap_user.attrs]
    if len(missing_attributes) > 0:
        LDAP_LOGGER.info(
            "[{username}] missing (or empty) LDAP attributes: {missing_attributes}".format(
                username=user.username, missing_attributes=", ".join(missing_attributes)
            )
        )

    # check if any attributes are missing that are marked as required => log warning otherwise
    required_attributes = (
        settings.AUTH_LDAP_REQUIRED_ATTRIBUTES if hasattr(settings, "AUTH_LDAP_REQUIRED_ATTRIBUTES") else []
    )

    missing_required_attributes = [attr for attr in missing_attributes if attr in required_attributes]
    if len(missing_required_attributes) > 0:
        LDAP_LOGGER.error(
            "[{username}] missing required LDAP attributes: {missing_attributes}".format(
                username=user.username, missing_attributes=", ".join(missing_required_attributes)
            )
        )

    # iterate over all attributes in the ldap profile attribute map
    for model_field, ldap_attribute in attribute_map.items():
        if ldap_attribute in ldap_user.attrs:
            ldap_value = ldap_user.attrs[ldap_attribute]
            set_user_profile_field_value(user_profile, model_field, ldap_value)
        elif len(missing_required_attributes) <= 0:
            # clear missing attributes only if all required attributes are present
            # to avoid clearing values because of connection problems
            clear_user_profile_field(user_profile, model_field)


def clear_user_profile_field(user_profile, field_name):
    clear_value = get_clear_field_value(field_name)
    set_user_profile_field_value(user_profile, field_name, clear_value)


def get_clear_field_value(field_name):
    """Gets the empty-value for fields on the user profile"""

    field = UserProfile._meta.get_field(field_name)

    if isinstance(field, ArrayField):
        return []
    elif field.null:
        return None
    elif field.blank:
        return ""
    else:
        return field.default


def set_user_profile_field_value(user_profile, field_name, new_value):
    user = user_profile.user
    try:
        old_value = getattr(user_profile, field_name)
    except AttributeError:
        old_value = get_clear_field_value(field_name)

    # process LDAP value (array to string for non-ArrayFields)
    field = UserProfile._meta.get_field(field_name)
    if not isinstance(field, ArrayField):
        new_value = ",".join(new_value)

    # update value if it changed
    if old_value != new_value:
        LDAP_LOGGER.info(f'[{user.username}] Field "{field_name}" changed from "{old_value}" to "{new_value}"')
        setattr(user_profile, field_name, new_value)


def assign_ldap_user_group(user, ldap_user, *args, **kwargs):
    """Assign an LDAP Group based on an LDAP attribute"""
    # get user group
    import re

    from django.contrib.auth.models import Group

    # iterate over all attributes in AUTH_LDAP_USER_ASSIGN_GROUP_BASED_ON_ATTRIBUTE
    for user_attribute in settings.AUTH_LDAP_USER_ASSIGN_GROUP_BASED_ON_ATTRIBUTE.keys():
        user_attribute_configs = settings.AUTH_LDAP_USER_ASSIGN_GROUP_BASED_ON_ATTRIBUTE[user_attribute]

        for user_attribute_config in user_attribute_configs:
            group = Group.objects.get(name=user_attribute_config["group_name"])

            # check if attribute is there
            if user_attribute in ldap_user.attrs:
                # check the regex
                pattern = re.compile(user_attribute_config["value_regex"])
                for value in ldap_user.attrs[user_attribute]:
                    if pattern.match(value):
                        group.user_set.add(user)


@receiver(reset_password_token_created)
def password_reset_token_created(sender, reset_password_token, *args, **kwargs):
    """
    Handles password reset tokens.
    When a token is created, an e-mail is sent to the user.
    :return:
    """
    # send an e-mail to the user
    context = {
        "current_user": reset_password_token.user,
        "username": reset_password_token.user.username,
        "email": reset_password_token.user.email,
        "workbench_url": settings.WORKBENCH_SETTINGS["url"],
        "reset_password_url": settings.WORKBENCH_SETTINGS["password_reset_url"].format(token=reset_password_token.key),
        "workbench_title": site_preferences.site_name,
    }

    # render email text
    email_html_message = render_to_string("email/user_reset_password.html", context)
    email_plaintext_message = render_to_string("email/user_reset_password.txt", context)

    msg = EmailMultiAlternatives(
        subject=_(f"Password Reset for {site_preferences.site_name}"),
        body=email_plaintext_message,
        from_email=site_preferences.no_reply_email,
        to=[reset_password_token.user.email],
    )
    msg.attach_alternative(email_html_message, "text/html")
    try:
        msg.send()
    except Exception as exc:
        LDAP_LOGGER.exception(exc)


@receiver(post_save)
def create_user_profile_normal(sender, instance, created, *args, **kwargs):
    """Automatically create user profile with a jwt verification token"""
    from eric.projects.models import MyUser

    if sender == get_user_model() or sender == MyUser:
        user = instance
        profiles = UserProfile.objects.filter(user=user)

        if len(profiles) == 0:
            UserProfile.objects.create(user=user, jwt_verification_token=generate_random_jwt_verification_token())
        elif profiles[0].jwt_verification_token == "":
            prof = profiles[0]
            prof.jwt_verification_token = generate_random_jwt_verification_token()
            prof.save()


def get_sender_user(sender, instance):
    try:
        if sender == TaskAssignedUser:
            return instance.assigned_user
        return instance.user
    except Exception as error:
        logging.error(error)


@receiver(post_save, sender=ProjectRoleUserAssignment)
@receiver(post_save, sender=TaskAssignedUser)
@receiver(post_save, sender=UserAttendsMeeting)
def send_invitation_mail_to_ldap_users(sender, instance, created, *args, **kwargs):
    if not created:
        return
    user = get_sender_user(sender, instance)
    user_profile = UserProfile.objects.filter(user=user).first()
    if not user_profile.type == UserProfile.LDAP_USER or user_profile.date_invited or user.last_login:
        return

    user_profile.date_invited = timezone.now()
    user_profile.save()

    current_user = get_current_user()
    current_user.__class__ = MyUser

    sending_element = ""
    if sender == ProjectRoleUserAssignment:
        sending_element = "project"
    if sender == TaskAssignedUser:
        sending_element = "task"
    if sender == UserAttendsMeeting:
        sending_element = "appointment"

    context = {
        "current_user": current_user,
        "username": user.username,
        "email": user.email,
        "sending_element": sending_element,
        "workbench_url": settings.WORKBENCH_SETTINGS["url"],
        "workbench_title": site_preferences.site_name,
    }
    # render email text (as plaintext and html)
    email_html_message = render_to_string("email/ldap_user_invited_to_workbench.html", context)
    email_plaintext_message = render_to_string("email/ldap_user_invited_to_workbench.txt", context)

    msg = EmailMultiAlternatives(
        subject=_(f"Invitation to {site_preferences.site_name}"),
        body=email_plaintext_message,
        from_email=site_preferences.no_reply_email,
        to=[user.email],
    )
    msg.attach_alternative(email_html_message, "text/html")
    try:
        msg.send()
    except Exception as error:
        logging.exception(error)
