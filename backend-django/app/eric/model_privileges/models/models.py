#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.conf import settings
from django.utils.translation import gettext_lazy as _

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import ugettext_lazy as _
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

    PRIVILEGE_CHOICES_ALLOW = "AL"
    PRIVILEGE_CHOICES_DENY = "DE"
    PRIVILEGE_CHOICES_NEUTRAL = "NE"

    PRIVILEGE_CHOICES = [
        (PRIVILEGE_CHOICES_ALLOW, _("Allow")),
        (PRIVILEGE_CHOICES_DENY, _("Deny")),
        (PRIVILEGE_CHOICES_NEUTRAL, _("Neutral"))
    ]

    class Meta:
        ordering = ['full_access_privilege', 'user__username']
        index_together = [('content_type', 'object_id')]
        track_fields = ('user', 'full_access_privilege',
                        'view_privilege', 'edit_privilege', 'delete_privilege', 'restore_privilege', 'trash_privilege',
                        'content_type', 'object_id')
        unique_together = (
            # make sure a user can only have one privilege per object
            ('user', 'content_type', 'object_id'),
        )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        verbose_name=_("User for this entity permission assignment"),
        related_name="model_privileges_new",
        on_delete=models.CASCADE
    )

    full_access_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user has full access on this entity"),
        default=PRIVILEGE_CHOICES_NEUTRAL,
        db_index=True
    )

    view_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user is allowed or not allowed to view this entity"),
        default=PRIVILEGE_CHOICES_NEUTRAL,
        db_index=True
    )

    edit_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user is allowed or not allowed to edit this entity"),
        default=PRIVILEGE_CHOICES_NEUTRAL,
        db_index=True
    )

    delete_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user is allowed or not allowed to delete this entity"),
        default=PRIVILEGE_CHOICES_NEUTRAL,
        db_index=True
    )

    trash_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user is allowed or not allowed to trash this entity"),
        default=PRIVILEGE_CHOICES_NEUTRAL,
        db_index=True
    )

    restore_privilege = models.CharField(
        max_length=2,
        choices=PRIVILEGE_CHOICES,
        verbose_name=_("Whether the user is allowed or not allowed to restore this entity"),
        default=PRIVILEGE_CHOICES_NEUTRAL,
        db_index=True
    )

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        verbose_name=_('Content type of the assigned entity'),
    )

    object_id = models.UUIDField(
        verbose_name=_('Object id of the assigned entity'),
    )

    content_object = GenericForeignKey(
        'content_type',
        'object_id'
    )

    def __str__(self):
        permissions = []

        if self.full_access_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW:
            permissions.append(_("Full Access"))

        if self.view_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW:
            permissions.append(_("View"))

        if self.edit_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW:
            permissions.append(_("Edit"))

        if self.delete_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW:
            permissions.append(_("Delete"))

        if self.restore_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW:
            permissions.append(_("Restore"))

        if self.trash_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW:
            permissions.append(_("Trash"))

        return _("User %(username)s permissions for %(entity_name)s: %(permissions)s") % {
            'username': self.user.username,
            'entity_name': str(self.content_object),
            'permissions': permissions
        }

    def is_deleteable(self):
        """
        Verifies whether this entity is deleteable or not
        :return:
        """
        if not self.full_access_privilege == ModelPrivilege.PRIVILEGE_CHOICES_ALLOW:
            # if is_owner is false, this entity is always deletable
            return True

        # else: if there are others that have is_owner, then this entity is deleteable
        if ModelPrivilege.objects.exclude(id=self.id).filter(
                content_type=self.content_type,
                object_id=self.object_id,
                full_access_privilege=ModelPrivilege.PRIVILEGE_CHOICES_ALLOW
        ).count() > 0:
            return True

        return False
