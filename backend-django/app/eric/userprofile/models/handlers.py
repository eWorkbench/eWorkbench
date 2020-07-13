#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from django.core.mail import EmailMultiAlternatives
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.utils.translation import gettext_lazy as _
from django_rest_passwordreset.signals import reset_password_token_created

from eric.site_preferences.models import options as site_preferences
from eric.userprofile.models import UserProfile

LDAP_LOGGER = logging.getLogger('eric.ldap')

User = get_user_model()


@receiver(post_save, sender=User)
def check_for_save_on_ldap_user(instance, created, *args, **kwargs):
    """
    When a user is created from LDAP, we need to do the initial sync
    :param instance:
    :param created:
    :param args:
    :param kwargs:
    :return:
    """
    if hasattr(instance, 'ldap_user'):
        create_user_profile_ldap(instance, instance.ldap_user, *args, **kwargs)
        assign_ldap_user_group(instance, instance.ldap_user, *args, **kwargs)


def create_user_profile_ldap(user, ldap_user, *args, **kwargs):
    """ Automatically create user profile and update ldap users profile """

    user_profile = get_or_create_userprofile(user)

    # update ldap user profile - read attribute map from settings
    from django.conf import settings
    if hasattr(settings, 'AUTH_LDAP_PROFILE_ATTR_MAP'):
        sync_mapped_ldap_attributes(settings.AUTH_LDAP_PROFILE_ATTR_MAP, user_profile, ldap_user)

    user_profile.type = UserProfile.LDAP_USER
    user_profile.save()


def get_or_create_userprofile(user):
    try:
        return user.userprofile
    except:
        # user profile does not exist yet
        return UserProfile(user=user)


def sync_mapped_ldap_attributes(attribute_map, user_profile, ldap_user):
    user = user_profile.user

    # Hint: LDAP does not send attributes with empty values.

    # check if any mapped attributes are missing => log info otherwise
    missing_attributes = [attr for attr in attribute_map.values() if attr not in ldap_user.attrs]
    if len(missing_attributes) > 0:
        LDAP_LOGGER.info(
            '[{username}] missing (or empty) LDAP attributes: {missing_attributes}'.format(
                username=user.username,
                missing_attributes=', '.join(missing_attributes)
            )
        )

    # check if any attributes are missing that are marked as required => log warning otherwise
    required_attributes = settings.AUTH_LDAP_REQUIRED_ATTRIBUTES \
        if hasattr(settings, 'AUTH_LDAP_REQUIRED_ATTRIBUTES') else []

    missing_required_attributes = [attr for attr in missing_attributes if attr in required_attributes]
    if len(missing_required_attributes) > 0:
        LDAP_LOGGER.error(
            '[{username}] missing required LDAP attributes: {missing_attributes}'.format(
                username=user.username,
                missing_attributes=', '.join(missing_required_attributes)
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
    """ Gets the empty-value for fields on the user profile """

    field = UserProfile._meta.get_field(field_name)

    if isinstance(field, ArrayField):
        return []
    elif field.null:
        return None
    elif field.blank:
        return ''
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
    """ Assign an LDAP Group based on an LDAP attribute """
    # get user group
    from django.contrib.auth.models import Group
    import re

    # iterate over all attributes in AUTH_LDAP_USER_ASSIGN_GROUP_BASED_ON_ATTRIBUTE
    for user_attribute in settings.AUTH_LDAP_USER_ASSIGN_GROUP_BASED_ON_ATTRIBUTE.keys():
        user_attribute_configs = settings.AUTH_LDAP_USER_ASSIGN_GROUP_BASED_ON_ATTRIBUTE[user_attribute]

        for user_attribute_config in user_attribute_configs:
            should_have_group = False
            group = Group.objects.get(name=user_attribute_config['group_name'])

            # check if attribute is there
            if user_attribute in ldap_user.attrs:
                # check the regex
                pattern = re.compile(user_attribute_config['value_regex'])
                for value in ldap_user.attrs[user_attribute]:
                    if pattern.match(value):
                        should_have_group = True

            if should_have_group:
                group.user_set.add(user)
            else:
                group.user_set.remove(user)


@receiver(reset_password_token_created)
def password_reset_token_created(sender, reset_password_token, *args, **kwargs):
    """
    Handles password reset tokens
    When a token is created, an e-mail needs to be sent to the user
    :param sender:
    :param reset_password_token:
    :param args:
    :param kwargs:
    :return:
    """
    # send an e-mail to the user
    context = {
        'current_user': reset_password_token.user,
        'username': reset_password_token.user.username,
        'email': reset_password_token.user.email,
        'workbench_url': settings.WORKBENCH_SETTINGS['url'],
        'reset_password_url': settings.WORKBENCH_SETTINGS['password_reset_url'].format(token=reset_password_token.key),
        'workbench_title': site_preferences.site_name
    }

    # render email text
    email_html_message = render_to_string('email/user_reset_password.html', context)
    email_plaintext_message = render_to_string('email/user_reset_password.txt', context)

    msg = EmailMultiAlternatives(
        # title:
        _("Password Reset for {title}".format(title=site_preferences.site_name)),
        # message:
        email_plaintext_message,
        # from:
        site_preferences.email_from,
        # to:
        [reset_password_token.user.email]
    )
    msg.attach_alternative(email_html_message, "text/html")
    msg.send()


@receiver(post_save)
def create_user_profile_normal(sender, instance, created, *args, **kwargs):
    """ Automatically create user profile with a jwt verification token """
    from eric.projects.models import MyUser

    if sender == get_user_model() or sender == MyUser:
        user = instance
        profiles = UserProfile.objects.filter(user=user)

        if len(profiles) == 0:
            UserProfile.objects.create(user=user, jwt_verification_token=uuid.uuid4().hex)
        elif profiles[0].jwt_verification_token == '':
            prof = profiles[0]
            prof.jwt_verification_token = uuid.uuid4().hex
            prof.save()
