#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import csv

from django.db.models import Q
from django.utils.timezone import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from eric.projects.models import ResourceBooking
from django.utils.timezone import localtime


class Command(BaseCommand):
    help = 'Example export of the bookings of a resource as csv'

    def add_arguments(self, parser):
        # Positional arguments
        parser.add_argument('resource_id', type=str)

    def handle(self, *args, **options):
        # today at 00:00
        start_date_time = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        # the day after tomorrow at 00:00
        end_date_time = start_date_time + timedelta(days=3)

        resource_id = options['resource_id']
        if resource_id:
            booking_objects = ResourceBooking.objects.filter(
                Q(
                    # filter for resource by pk
                    # and the date_time_start must be within the range between start_date_time and end_date_time
                    resource__pk=resource_id,
                    date_time_start__gte=start_date_time,
                    date_time_start__lte=end_date_time
                ) | Q(
                    # filter for resource by pk
                    # and the date_time_end must be within the range between start_date_time and end_date_time
                    resource__pk=resource_id,
                    date_time_end__gte=start_date_time,
                    date_time_end__lte=end_date_time
                )).order_by('date_time_start')

            # write the csv file into the app dir (next to manage.py)
            filename = 'resourcebooking-example-export-{}.csv'.format(start_date_time.strftime('%Y-%m-%d'))
            with open(filename, 'w', newline='') as csvfile:
                csvwriter = csv.writer(csvfile)
                # the first row has the headlines
                csvwriter.writerow(['resource.name', 'date_time_start', 'date_time_end'])
                for booking in booking_objects:
                    csvwriter.writerow([
                        booking.resource.name,
                        localtime(booking.date_time_start),
                        localtime(booking.date_time_end),
                    ])
