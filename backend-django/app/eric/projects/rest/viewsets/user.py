#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import mimetypes
import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import get_password_validators, validate_password
from django.core.exceptions import ValidationError
from django.core.mail import EmailMultiAlternatives
from django.db.models import Q
from django.http import FileResponse, HttpResponseForbidden
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from rest_framework import exceptions, status, viewsets
from rest_framework.decorators import action, parser_classes
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from django_auth_ldap.backend import LDAPBackend
from django_rest_passwordreset.models import ResetPasswordToken
from django_userforeignkey.request import get_current_user
from PIL import Image, ImageOps

from eric.core.rest.viewsets import BaseAuthenticatedUpdateOnlyModelViewSet, BaseGenericViewSet
from eric.model_privileges.models import ModelPrivilege
from eric.projects.models import MyUser
from eric.projects.rest.permissions import CanInviteExternalUsers, IsStaffOrTargetUserOrReadOnly
from eric.projects.rest.serializers import InviteUserSerializer, MyUserSerializer, PublicUserSerializer
from eric.shared_elements.models import CalendarAccess
from eric.site_preferences.models import options as site_preferences
from eric.userprofile.models import UserProfile

User = get_user_model()

logger = logging.getLogger(__name__)


class UserSearchListModelMixin:
    """
    Lists the User Search Queryset, and restricts it to 50 results
    """

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset[:50], many=True)
        return Response(serializer.data)


class PublicUserViewSet(
    BaseGenericViewSet, UserSearchListModelMixin, viewsets.mixins.RetrieveModelMixin, viewsets.mixins.UpdateModelMixin
):
    """Authed user list, allowing edits only for the current user (or for staff members)
    Allows searching for users
    """

    # do not use user.objects.all here
    queryset = MyUser.objects.none()
    serializer_class = PublicUserSerializer
    permission_classes = (
        IsAuthenticated,
        IsStaffOrTargetUserOrReadOnly,
    )
    filterset_fields = ("is_staff",)
    search_fields = (
        "username",
        "email",
        "userprofile__first_name",
        "userprofile__last_name",
    )
    # allow order by
    ordering_field = (
        "username",
        "email",
    )
    ordering = ("username",)

    throttle_classes = (UserRateThrottle,)

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        from eric.userprofile.models import UserProfile

        user = self.request.user

        # prevent empty search requests that would lead to information leakage
        if (
            "search" in self.request.query_params
            and len(self.request.query_params["search"]) > 1
            or "user_id" in self.request.query_params
        ):
            if user.is_superuser:
                # superusers can find all users
                users = self.get_all_users()
            elif user.userprofile.type == UserProfile.LDAP_USER:
                # LDAP users can find all other LDAP users + users in shared projects
                users = (self.get_users_with_shared_projects() | self.get_ldap_users()).distinct()
            # this is used in user searches in the calendar and for the creation of new meetings
            # 'access_user' has to be in the request url as a parameter
            elif "access_user" in self.request.query_params:
                # filter users who gave the user view privileges for their calendar
                # 1. get the content type of CalendarAccesss
                calendar_access_privilege_content_type_id = CalendarAccess.get_content_type().id
                # 2. get the users who gave the request user edit or view privilege to their calendars
                # depending on the request. If 'access_editable' is in the request url it is a search for users
                # that have editable privileges (new meeting)
                if "access_editable" in self.request.query_params and self.request.query_params["access_editable"]:
                    # get the users who gave the request user the view_privilege to their calendars
                    model_privilege_users = (
                        ModelPrivilege.objects.all()
                        .filter(
                            Q(
                                content_type=calendar_access_privilege_content_type_id,
                                user=user,
                                full_access_privilege=ModelPrivilege.ALLOW,
                            )
                            | Q(
                                content_type=calendar_access_privilege_content_type_id,
                                user=user,
                                edit_privilege=ModelPrivilege.ALLOW,
                            )
                        )
                        .values("created_by")
                    )
                # If 'access_editable' is not in the request url we search for the view privilege
                else:
                    # get the users who gave the request user the view_privilege to their calendars
                    model_privilege_users = (
                        ModelPrivilege.objects.all()
                        .filter(
                            Q(
                                content_type=calendar_access_privilege_content_type_id,
                                user=user,
                                full_access_privilege=ModelPrivilege.ALLOW,
                            )
                            | Q(
                                content_type=calendar_access_privilege_content_type_id,
                                user=user,
                                view_privilege=ModelPrivilege.ALLOW,
                            )
                        )
                        .values("created_by")
                    )
                # 3. now lets filter down the active users to only return the users from point 2, so
                # we know they are active as well
                users = self.get_all_users().filter(pk__in=model_privilege_users)
            else:
                # non-LDAP users can find users of shared projects only
                users = self.get_users_with_shared_projects()
            if "user_id" in self.request.query_params:
                try:
                    users = users.filter(pk=self.request.query_params["user_id"])
                except Exception:
                    logger.error(f"Could not find user_id {self.request.query_params['user_id']}")
        else:
            # no search term -> return self only
            users = self.get_all_users().filter(pk=user.pk)

        return users.select_related("userprofile")

    @staticmethod
    def get_all_users():
        return MyUser.objects.filter(is_active=True)

    @classmethod
    def get_ldap_users(cls):
        from eric.userprofile.models import UserProfile

        return cls.get_all_users().filter(userprofile__type=UserProfile.LDAP_USER)

    @classmethod
    def get_users_with_shared_projects(cls):
        from eric.projects.models import Project

        pks = Project.objects.viewable().values_list("assigned_users_roles__user__pk", flat=True)
        return cls.get_all_users().filter(pk__in=pks)

    @action(detail=False, methods=["POST"], permission_classes=[IsAuthenticated, CanInviteExternalUsers])
    def invite_user(self, request, *args, **kwargs):
        """
        Endpoint for inviting a new external user with their e-mail address to the workbench.
        Throws a validation error if the e-mail address already exists.
        """

        serializer = InviteUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # get email and message
        email = request.data["email"]
        message = request.data["message"]

        # check if a user with this e-mail already exists (must be case insensitive)
        if MyUser.objects.filter(email__iexact=email).exists():
            # get the user and
            user = MyUser.objects.filter(email__iexact=email).first()
            # serialize the user object
            serializer = self.get_serializer(user, many=False)
            # done! Return the current user via REST API, so the user will be added to the project at this point
            return Response(serializer.data, status=status.HTTP_200_OK)

        # separate email by the @ sign
        parts = email.split("@")

        # take the first part of this email as the username (and remove . and _)
        username = parts[0].replace(".", "").replace("_", "")

        username_exists = True
        orig_username = username
        min_number = 1
        # check that this username does not exist
        while username_exists:
            if MyUser.objects.filter(username=username).count() == 0:
                # does not exist --> we can create it
                username_exists = False
            else:
                # add a random number behind the username and try again
                username = orig_username + str(min_number)
                # increase min_number
                min_number += 1

        # generate a random password
        password = MyUser.objects.make_random_password()

        user = MyUser.objects.create_user(username, email, password, is_staff=False, is_active=True)

        user_profile = UserProfile.objects.filter(user=user).first()
        user_profile.date_invited = timezone.now()
        user_profile.save()

        current_user = get_current_user()
        current_user.__class__ = MyUser

        token = ResetPasswordToken.objects.create(
            user=user, user_agent=request.META["HTTP_USER_AGENT"], ip_address=request.META["REMOTE_ADDR"]
        )
        # send an e-mail to the user
        context = {
            "current_user": current_user,
            "username": username,
            "email": email,
            "reset_password_url": settings.WORKBENCH_SETTINGS["password_reset_url"].format(token=token.key),
            "message": message,
            "workbench_url": settings.WORKBENCH_SETTINGS["url"],
            "workbench_title": site_preferences.site_name,
        }

        # add user to group External
        g = Group.objects.get(name="External")
        g.user_set.add(user)

        # render email text (as plaintext and html)
        email_html_message = render_to_string("email/user_invited_to_workbench.html", context)
        email_plaintext_message = render_to_string("email/user_invited_to_workbench.txt", context)

        msg = EmailMultiAlternatives(
            subject=_(f"Invitation to {site_preferences.site_name}"),
            body=email_plaintext_message,
            from_email=site_preferences.no_reply_email,
            to=[email],
        )
        msg.attach_alternative(email_html_message, "text/html")
        try:
            msg.send()
        except Exception as exc:
            logger.exception(exc)

        # serialize the user object
        serializer = self.get_serializer(user, many=False)

        # done! Return the current user via REST API
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyUserViewSet(BaseAuthenticatedUpdateOnlyModelViewSet):
    """Handles information about the currently logged in user."""

    serializer_class = MyUserSerializer

    def get_queryset(self):
        current_user = get_current_user()
        return User.objects.filter(pk=current_user.pk)

    def get_object(self):
        from eric.userprofile.models import UserProfile

        """ Return the current user
        For ldap users we need to update the users profile (and the related groups)
        """
        if self.request.user.userprofile.type == UserProfile.LDAP_USER:
            user = LDAPBackend().populate_user(self.request.user.username)
            if user is None:
                # we couldn't find the ldap user
                logger.error(
                    "Could not find user {username} in the ldap backend, "
                    "although userprofile.type is set to LDAP_USER in self.request.user".format(
                        username=self.request.user.username
                    )
                )
                raise NotFound()
            return user

        return self.request.user

    def list(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        """Updates information about the currently logged-in user."""

        # override put method to allow updates on the "list" endpoint
        return self.update(request, *args, **kwargs)

    @action(detail=False, methods=["PUT"])
    def change_password(self, request, *args, **kwargs):
        """Changes the current users password."""

        user = self.get_object()
        if user.has_usable_password():
            password = request.data["password"]

            try:
                # validate the password against existing validators
                validate_password(
                    password, user=user, password_validators=get_password_validators(settings.AUTH_PASSWORD_VALIDATORS)
                )
            except ValidationError as e:
                # raise a validation error for the serializer
                raise exceptions.ValidationError({"password": e.messages})

            user.set_password(password)
            user.save()
            return Response()

        else:
            return HttpResponseForbidden()

    @action(detail=False, methods=["GET"])
    def avatar(self, *args, **kwargs):
        """Gets the profile picture of the current user."""

        # get the user
        avatar = self.get_object()
        file = avatar.userprofile.avatar

        # create a file response
        file_path = os.path.join(settings.MEDIA_ROOT, file.name)
        response = FileResponse(open(file_path, "rb"))
        # set filename in header
        response["Content-Disposition"] = f'attachment; filename="{file.name}"'
        # gets the mime type
        response["Content-Type"] = mimetypes.guess_type(file.name)

        return response

    @action(detail=False, methods=["PUT"])
    @parser_classes(
        (
            FormParser,
            MultiPartParser,
        )
    )
    def update_avatar(self, request, *args, **kwargs):
        """Endpoint for uploading a new profile picture."""

        from eric.userprofile.rest.serializers import UserProfileAvatarSerializer

        if "avatar" in request.data:
            # get the user object
            user = self.get_object()

            # update the avatar via the userprofile serializer
            serializer = UserProfileAvatarSerializer(user.userprofile, data=request.data)
            # serializer would raise an exception if some data is invalid
            serializer.is_valid(raise_exception=True)
            # saving
            serializer.save()

            # resize the image to the preferred size
            image = Image.open(request.data["avatar"])
            size = settings.AVATAR_SIZE
            image = ImageOps.fit(image, size, Image.LANCZOS)
            # saving the resized image
            image.save(user.userprofile.avatar.path)

            # refresh the object from db that the return object is updated
            user.userprofile.refresh_from_db()

            # done! Return the current user via REST API
            serializer = self.get_serializer(user, many=False)
            return Response(serializer.data, status=status.HTTP_200_OK)

        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)
