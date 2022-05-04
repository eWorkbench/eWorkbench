#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.utils.translation import gettext_lazy as _
import dbsettings


class GenericConfiguration(dbsettings.Group):
    """
    Generic Configuration of eRIC Workbench, which is displayed in the /site_preferences endpoint
    There is also an admin page for this configuration
    """

    site_name = dbsettings.TextValue(
        help_text=_("Name of the site"),
        default="eRIC Workbench"
    )
    site_logo = dbsettings.ImageValue(
        help_text=_("Logo of the site"),
        upload_to="site_preferences/",
        required=False
    )
    email_from = dbsettings.TextValue(
        help_text=_("Email address used when sending emails from the server"),
        default="",
        required=False
    )
    navbar_background_color = dbsettings.TextValue(
        help_text=_("Background Color of the navbar"),
        default="#2C9BA9"
    )
    navbar_border_color = dbsettings.TextValue(
        help_text=_("Border Color of the navbar"),
        default="#2C9BA9"
    )
    max_upload_size_in_megabyte = dbsettings.IntegerValue(
        help_text=_("Maximum size of a single file when uploading in MegaByte"),
        default=2
    )
    element_lock_time_in_minutes = dbsettings.IntegerValue(
        help_text=_("Time in minutes for an element to be locked"),
        default=3
    )
    element_lock_webdav_time_in_minutes = dbsettings.IntegerValue(
        help_text=_("Time in minutes for a webdav element to be locked"),
        default=90
    )
    extracted_images_rate_limit = dbsettings.TextValue(
        help_text=_('Rate limit for throttling API requests in format "requests/interval", e.g. "100/min"'),
        default='100/min'
    )
    bookings_per_room_in_study_room_booking_display_export = dbsettings.IntegerValue(
        help_text=_("Bookings per room in study room bookings CSV export for displays"),
        default=6
    )


options = GenericConfiguration(_("Generic Site Configuration"))
