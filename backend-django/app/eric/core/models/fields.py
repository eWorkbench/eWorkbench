#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db import transaction
from django.db.models import fields
from django.utils.translation import gettext_lazy as _


class AutoIncrementIntegerWithPrefixField(fields.PositiveIntegerField):
    """
    Auto Increment Integer based on a given prefix

    The prefix element (prefix_lookup) can be a foreign key element, e.g., project__pk or user__pk or ...
    """

    description = _("Auto increment integer with prefix")

    def __init__(self, prefix_lookup=None, **kwargs):
        self.prefix_lookup = prefix_lookup

        # start at 1
        kwargs["default"] = 0
        # this field is auto assigned, therefore not editable
        kwargs["editable"] = False
        # add an index to this field
        kwargs["db_index"] = True

        super().__init__(**kwargs)

    def pre_save(self, model_instance, add):
        # check current value
        current_value = self.value_from_object(model_instance)

        if not current_value:
            model = model_instance.__class__

            # wrap everything in a transaction because select_for_update() needs it
            with transaction.atomic():
                # in case the table is already locked, wait for it
                model.objects.select_for_update().last()
                # problem: select_for_update only retrieves the rows that were available at the beginning of the
                # transaction if a new row was inserted by another concurrent transaction, this row would not be
                # retrieved therefore we MUST use select_for_update() twice;

                if self.prefix_lookup:
                    # get the value of the prefix_element
                    lookups = self.prefix_lookup.split("__")
                    from functools import reduce  # Python 3 Fix for reduce

                    lookup_value = reduce(getattr, [model_instance] + lookups)

                    # get the last value that needs to be incremented
                    value = (
                        model.objects.select_for_update()
                        .filter(**{self.prefix_lookup: lookup_value})
                        .order_by(self.prefix_lookup, self.name)
                        .values_list(self.name, flat=True)
                        .last()
                    )
                else:
                    # get the last value that needs to be incremented
                    value = (
                        model.objects.select_for_update().order_by(self.name).values_list(self.name, flat=True).last()
                    )

                # increment it
                value = value or self.default
                value += 1
                # store it
                setattr(model_instance, self.name, value)

        return super().pre_save(model_instance, add)
