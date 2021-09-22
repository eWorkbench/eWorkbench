#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from eric.userprofile.models import UserProfile

User = get_user_model()

# Tuple of fields used in the user-profile-serializers below

PUBLIC_USER_FIELDS = (
    'first_name', 'last_name', 'anonymized', 'academic_title', 'additional_information', 'country',
    'email_others',
    'org_zug_mitarbeiter', 'org_zug_mitarbeiter_lang', 'org_zug_student', 'org_zug_student_lang',
    'phone', 'salutation', 'title_salutation', 'title_pre', 'title_post', 'type', 'avatar', 'website', 'avatar_is_set',
)


class MyUserProfileSerializer(serializers.ModelSerializer):
    """Should only be used for the current user, exposes sensitive data such as ui_settings """

    class Meta:
        model = UserProfile
        fields = PUBLIC_USER_FIELDS + ('ui_settings',)
        read_only_fields = ('type', 'avatar_is_set')

    def update(self, instance, validated_data):
        """
        Verifies that LDAP users can only update additional_information and website
        :param instance:
        :param validated_data:
        :return:
        """
        if instance.type == UserProfile.LDAP_USER:
            errors = {}
            allowed_fields = ["website", "additional_information", "ui_settings"]
            for field in UserProfile._meta.get_fields():
                # ToDo: We can probably compare allowed_fields with ldap settings (which fields are auto mapped)
                if field.name not in allowed_fields and field.name in validated_data \
                        and getattr(instance, field.name) != validated_data[field.name]:
                    errors[field.name] = ValidationError(
                        _("Can not update this field, as information is retrieved automatically from LDAP"),
                        params={field.name: validated_data[field.name]},
                        code='invalid'
                    )
            if len(errors.keys()) > 0:
                raise ValidationError(errors)

        return super(MyUserProfileSerializer, self).update(instance, validated_data)


class PublicUserProfileSerializer(serializers.ModelSerializer):
    """ Use for public user profiles, exposes only public attributes"""

    class Meta:
        model = UserProfile
        fields = PUBLIC_USER_FIELDS
        read_only_fields = ('type',)


class UserProfileAvatarSerializer(serializers.ModelSerializer):
    """ A minimalistic avatar serializer """

    class Meta:
        model = UserProfile
        fields = ('avatar', 'avatar_height', 'avatar_width',)
        read_only_fields = ('avatar_height', 'avatar_width',)
