#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from django_changeset.models import RevisionModelMixin

from eric.core.admin.is_deleteable import IsDeleteableMixin
from eric.core.models import BaseModel
from eric.core.models.abstract import ChangeSetMixIn
from eric.model_privileges.managers import ModelPrivilegeManager


class ModelPrivilege(BaseModel, ChangeSetMixIn, RevisionModelMixin, IsDeleteableMixin):
    """
    Special Permissions for each user and entity
    """

    objects = ModelPrivilegeManager()

    ALLOW = "AL"
    DENY = "DE"
    NEUTRAL = "NE"

    PRIVILEGE_CHOICES = [(ALLOW, _("Allow")), (DENY, _("Deny")), (NEUTRAL, _("Neutral"))]

    PRIVILEGE_TO_PERMISSION_MAP = {
        "full_access_privilege": "is_owner",
        "view_privilege": "can_view",
        "edit_privilege": "can_edit",
        "trash_privilege": "can_trash",
        "restore_privilege": "can_restore",
        "delete_privilege": "can_delete",
    }

    class Meta:
        ordering = ["full_access_privilege", "user__username"]
        index_together = [("content_type", "object_id")]
        track_fields = (
            "user",
            "full_access_privilege",
            "view_privilege",
            "edit_privilege",
            "delete_privilege",
            "restore_privilege",
            "trash_privilege",
            "content_type",
            "object_id",
        )
        unique_together = (
            # make sure a user can only have one privilege per object
            ("user", "content_type", "object_id"),
        )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("User for this entity permission assignment"),
        related_name="model_privileges_new",
        on_delete=models.CASCADE,
    )

    full_access_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user has full access on this entity"),
        default=NEUTRAL,
        db_index=True,
    )

    view_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user is allowed or not allowed to view this entity"),
        default=NEUTRAL,
        db_index=True,
    )

    edit_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user is allowed or not allowed to edit this entity"),
        default=NEUTRAL,
        db_index=True,
    )

    delete_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user is allowed or not allowed to delete this entity"),
        default=NEUTRAL,
        db_index=True,
    )

    trash_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user is allowed or not allowed to trash this entity"),
        default=NEUTRAL,
        db_index=True,
    )

    restore_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user is allowed or not allowed to restore this entity"),
        default=NEUTRAL,
        db_index=True,
    )

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name=_("Content type of the assigned entity"),
    )

    object_id = models.UUIDField(
        verbose_name=_("Object id of the assigned entity"),
    )

    content_object = GenericForeignKey("content_type", "object_id")

    def __str__(self):
        permissions = []

        if self.full_access_privilege == ModelPrivilege.ALLOW:
            permissions.append(_("Full Access"))

        if self.view_privilege == ModelPrivilege.ALLOW:
            permissions.append(_("View"))

        if self.edit_privilege == ModelPrivilege.ALLOW:
            permissions.append(_("Edit"))

        if self.delete_privilege == ModelPrivilege.ALLOW:
            permissions.append(_("Delete"))

        if self.restore_privilege == ModelPrivilege.ALLOW:
            permissions.append(_("Restore"))

        if self.trash_privilege == ModelPrivilege.ALLOW:
            permissions.append(_("Trash"))

        return _("User %(username)s permissions for %(entity_name)s: %(permissions)s") % {
            "username": self.user.username,
            "entity_name": str(self.content_object),
            "permissions": permissions,
        }

    def is_deleteable(self):
        """
        Verifies whether this privilege can be deleted or not.
        A FullAccess privilege may only be deleted if there are other users with FullAccess.
        :return:
        """
        if not self.full_access_privilege == ModelPrivilege.ALLOW:
            return True

        return (
            ModelPrivilege.objects.exclude(id=self.id)
            .filter(
                content_type=self.content_type, object_id=self.object_id, full_access_privilege=ModelPrivilege.ALLOW
            )
            .exists()
        )
