#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os
import uuid

from django.utils.translation import gettext_lazy as _
from django.db import models
from django_userforeignkey.models.fields import UserForeignKey

from eric.core.models import BaseModel
from eric.core.models.abstract import OrderingModelMixin, VisibleModelMixin

from eric.sortable_menu.models.managers import MenuEntryManager, MenuEntryParameterManager


class MenuEntry(BaseModel, OrderingModelMixin, VisibleModelMixin):
    """
    Menu Entries for a user
    """

    objects = MenuEntryManager()

    class Meta:
        verbose_name = _("Menu Entry")
        verbose_name_plural = _("Menu Entries")
        ordering = ('owner', 'ordering', 'route', )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    route = models.CharField(
        max_length=128,
        verbose_name=_("Route (State) of this menu entry"),
        blank=False
    )

    owner = UserForeignKey(
        auto_user_add=True,
        verbose_name=_("User that owns the menu entry"),
        related_name="menu_entries",
        on_delete=models.SET_NULL
    )

    def __str__(self):
        return "MenuEntry for route {}".format(self.route)


class MenuEntryParameter(BaseModel):
    """
    Each menu entry has multiple parameters
    e.g.:
    MenuEntry
        name = meeting-list
        menu_entry_parameters =
            MenuEntryParameter 1:
                name = start_date__gte
                value = 2017-01-01
            MenuEntryParameter 2:
                name = end_date__lte
                value = 2017-01-31
    """

    objects = MenuEntryParameterManager()

    class Meta:
        verbose_name = _("Parameter of a Menu Entry")
        verbose_name_plural = _("Parameters of a Menu Entry")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    menu_entry = models.ForeignKey(
        MenuEntry,
        related_name="menu_entry_parameters",
        verbose_name=_("Which Menu Entry is this parameter associated to"),
        on_delete=models.CASCADE
    )

    name = models.CharField(
        max_length=128,
        verbose_name=_("Name of the parameter"),
        blank=False
    )

    value = models.CharField(
        max_length=128,
        verbose_name=_("Value of the parameter"),
        blank=True
    )

    def __str__(self):
        return "MenuEntryParameter for menu entry {menu_entry_name}: {name}='{value}'".format(
            menu_entry_name=self.menu_entry.route,
            name=self.name,
            value=self.value
        )
