#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import gettext_lazy as _

from eric.core.models import BaseModel, UploadToPathAndRename
from eric.userprofile.models.managers import UserProfileManager

User = get_user_model()


class UserProfile(BaseModel):
    """ Profile of a user, containing additional information """
    objects = UserProfileManager()

    class Meta:
        verbose_name = _("User Profile")
        verbose_name_plural = _("User Profiles")

    REQUIRED_FIELDS = ('user',)

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    # custom fields
    # User Type Choices
    NORMAL_USER = 'u'
    LDAP_USER = 'l'
    USER_TYPE_CHOICES = (
        (NORMAL_USER, 'Normal User'),
        (LDAP_USER, 'LDAP User')
    )
    # added a db index for first_name and last_name within migrations here:
    # app/eric/userprofile/migrations/0008_create_userprofile_first_name_and_last_name_index.py
    # this was done to speed up the user search on /api/users/?search=...
    # username and email from the auth.User model are already indexed according to
    # app/eric/projects/migrations/0078_create_user_uppercase_index.py and
    # app/eric/projects/migrations/0079_create_user_email_uppercase_index.py
    first_name = models.CharField(
        max_length=128,
        verbose_name=_('First name'),
        blank=True
    )
    last_name = models.CharField(
        max_length=128,
        verbose_name=_('Last name'),
        blank=True
    )
    anonymized = models.BooleanField(
        default=False,
        verbose_name=_('Anonymized User')
    )
    academic_title = models.CharField(
        max_length=128,
        verbose_name=_("Academic title of the user"),
        blank=True
    )
    additional_information = models.TextField(
        verbose_name=_("Additional information about the user"),
        blank=True
    )
    country = models.CharField(
        max_length=128,
        verbose_name=_("Country of the user"),
        blank=True
    )
    email_others = ArrayField(
        models.EmailField(max_length=128, blank=True),
        default=list,
        blank=True,
        null=True,
        verbose_name=_("Other E-mail addresses of the user")
    )
    org_zug_mitarbeiter = ArrayField(
        models.CharField(max_length=128, blank=True),
        default=list,
        blank=True,
        null=True,
        verbose_name=_("Which organisation this user belongs to (if the user is an employee)")
    )
    org_zug_mitarbeiter_lang = ArrayField(
        models.CharField(max_length=256, blank=True),
        default=list,
        blank=True,
        null=True,
        verbose_name=_("org_zug_mitarbeiter_lang")
    )
    org_zug_student = ArrayField(
        models.CharField(max_length=128, blank=True),
        default=list,
        blank=True,
        null=True,
        verbose_name=_("Which organization this user belongs to (if the user is a student)")
    )
    org_zug_student_lang = ArrayField(
        models.CharField(max_length=256, blank=True),
        default=list,
        blank=True,
        null=True,
        verbose_name=_("org_zug_student_lang")
    )
    phone = models.CharField(
        max_length=128,
        verbose_name=_("Phone number of the user"),
        blank=True
    )
    salutation = models.CharField(
        max_length=128,
        verbose_name=_("Salutation of the user"),
        blank=True
    )
    title_salutation = models.CharField(
        max_length=128,
        verbose_name=_("Salutation title of the user"),
        blank=True
    )
    title_pre = models.CharField(
        max_length=128,
        verbose_name=_("Pre title of the user"),
        blank=True
    )
    title_post = models.CharField(
        max_length=128,
        verbose_name=_("Post title of the user"),
        blank=True
    )
    type = models.CharField(
        max_length=5,
        choices=USER_TYPE_CHOICES,
        default=NORMAL_USER,
        verbose_name=_("Type of the user object")
    )

    avatar = models.ImageField(
        upload_to=UploadToPathAndRename('profile_pictures'),
        max_length=255,
        verbose_name=_("Avatar of the user"),
        height_field='avatar_height',
        width_field='avatar_width',
        default='unknown_user.gif'
    )
    avatar_height = models.PositiveIntegerField(
        null=True,
        blank=True,
        editable=False
    )
    avatar_width = models.PositiveIntegerField(
        null=True,
        blank=True,
        editable=False
    )

    website = models.URLField(
        verbose_name=_("URL of the User"),
        null=True,
        blank=True
    )

    jwt_verification_token = models.CharField(
        max_length=128,
        verbose_name=_("Verification Token for JWT"),
        default=''
    )

    ui_settings = models.JSONField(
        verbose_name=_("Persistent UI settings that have no effect on the backend"),
        null=True,
        blank=True,
    )

    def __str__(self):
        return _("User profile of %(username)s") % {'username': self.user.username}

    @property
    def first_name_and_last_name(self):
        name = f'{self.first_name} {self.last_name}'.strip()
        return name or '-'

    @property
    def avatar_is_set(self):
        # returns false if no avatar is set and true if an avatar was uploaded
        return self.avatar != 'unknown_user.gif'
