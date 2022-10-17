#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import copy
import logging
import os
import sys
from datetime import datetime, timedelta
from enum import Enum

from django.core.management.base import BaseCommand

from eric.statistics.models.models import Statistic

# request_time_middleware log structure:
#  0: DEBUG <datetime> ("DEBUG 2019-10-03T08:21:08.280051"),
#  1: response/request ("response"),
#  2: request uuid ("c012c77e-e5b6-11e9-9fb2-0242ac130008"),
#  3: number of logs for that request ("2"),
#  4: request method ("GET"),
#  5: url ("/api/me/"),
#  6: timedelta between first logged message for this request and current message ("0.3091 seconds"),
# --- dynamic part, for responses only:
#  7: user ("by user1"),
#  8: response status ("status 200"),
#  9: bytes sent ("sent 2 bytes"),
# 10: query count ("8 queries"),
# 11: query execution time ("0.0320 seconds")

logger = logging.getLogger(__name__)


DATE_FORMAT = "%Y-%m-%d"


class PeriodClass:
    def __init__(self, name, days, date):
        self.name = name
        self.days = days
        self.date = date


class SearchClass:
    def __init__(self, name, settings):
        self.name = name
        self.settings = settings


class SettingClass:
    def __init__(self, field, search=None, exact_search=False, unique=False, equal=True):
        self.field = field
        self.search = search
        self.exact_search = exact_search
        self.unique = unique
        self.equal = equal


class UniqueTogetherClass:
    def __init__(self, settings):
        self.settings = settings


class ExistsSeveralTimes:
    def __init__(self, setting, count):
        self.setting = setting
        self.count = count


AVAILABLE_FIELDS = Enum("Fields", [("date", 0), ("type", 1), ("method", 4), ("url", 5), ("user", 7)])


def search_in_log(setting, search_item, log_data):
    found = False
    if setting.exact_search and search_item == log_data:
        found = True
    elif not setting.exact_search and search_item in log_data:
        found = True
    return found


def filter_logs(setting, logs):
    result = []
    unique_items = []
    log_index = setting.field.value
    for log in logs:
        data = log.split(",")
        if index_exists(data, log_index):
            if setting.search:
                found = False
                if type(setting.search) == list:
                    for search_item in setting.search:
                        if not found:
                            found = search_in_log(setting, search_item, data[log_index])
                elif setting.search in data[log_index]:
                    found = search_in_log(setting, setting.search, data[log_index])
                if (not found and setting.equal) or (found and not setting.equal):
                    continue
            if setting.unique:
                if data[log_index] not in unique_items:
                    unique_items.append(data[log_index])
                    result.append(log)
            else:
                result.append(log)
    return result


def filter_unique_together(unique_together, logs):
    result = []
    unique_items = []
    for log in logs:
        unique_id = ""
        data = log.split(",")
        is_right = True
        for setting in unique_together.settings:
            if is_right:
                log_index = setting.field.value
                if index_exists(data, log_index):
                    if setting.search:
                        found = False
                        if type(setting.search) == list:
                            for search_item in setting.search:
                                if not found:
                                    found = search_in_log(setting, search_item, data[log_index])
                                    if found:
                                        unique_id = unique_id + search_item
                        elif setting.search in data[log_index]:
                            found = search_in_log(setting, setting.search, data[log_index])
                            if found:
                                unique_id = unique_id + setting.search
                        if (not found and setting.equal) or (found and not setting.equal):
                            is_right = False
                    else:
                        unique_id = unique_id + data[log_index]
        if is_right and unique_id not in unique_items:
            unique_items.append(unique_id)
            result.append(log)
    return result


def filter_exists_several_times(exists_several_times, logs):
    result = []
    log_index = exists_several_times.setting.field.value
    for log in logs:
        data = log.split(",")
        item = data[log_index]
        count = sum(llog.split(",")[log_index] == item for llog in logs)
        if count == exists_several_times.count:
            result.append(log)
    return result


def handle_statistic_setting(settings, logs, index=0):
    setting = settings[index]
    if type(setting) == UniqueTogetherClass:
        result = filter_unique_together(setting, logs)
    elif type(setting) == ExistsSeveralTimes:
        result = filter_exists_several_times(setting, logs)
    else:
        result = filter_logs(setting, logs)

    if index_exists(settings, index + 1):
        return handle_statistic_setting(settings, result, index + 1)
    return result


def index_exists(array, index):
    try:
        array[index]
        return True
    except IndexError:
        return False


def get_yesterday():
    return datetime.now() - timedelta(1)


def get_last_week_monday():
    today = datetime.now()
    today_weekday = today.weekday()
    return today - timedelta(today_weekday + 7)


def get_last_week_days():
    days = []
    for i in range(7):
        day = get_last_week_monday() + timedelta(i)
        days.append(datetime.strftime(day, DATE_FORMAT))
    return days


class Command(BaseCommand):
    general_statistic_settings = [
        SettingClass(AVAILABLE_FIELDS.type, search="response"),
        SettingClass(AVAILABLE_FIELDS.user, search="AnonymousUser", equal=False),
    ]

    statistics = [
        SearchClass(
            "Unique Users - All",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Labbooks - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/labbooks"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Labbooks - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/labbooks"),
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Tasks - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/tasks"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Tasks - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/tasks"),
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Task boards - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/kanbanboards"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Task boards - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/kanbanboards"),
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Contacts - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/contacts"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Contacts - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/contacts"),
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Calendar - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/my/schedule"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Appointments - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/meetings"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Appointments - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/meetings"),
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Pictures - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/pictures"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Pictures - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/pictures"),
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Storages - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/drives"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Storages - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/drives"),
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Resources - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/resources"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Resources - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/resources"),
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "DMPs - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/dmps"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "DMPs - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/dmps"),
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Files - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/files"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Files - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/files"),
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Projects - Unique user calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/projects"),
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="favourite=true", equal=False),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Projects - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.url, search="/api/projects"),
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Labbooks and Tasks - Unique calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                UniqueTogetherClass(
                    [
                        SettingClass(AVAILABLE_FIELDS.url, search=["/api/labbooks", "/api/tasks"]),
                        SettingClass(AVAILABLE_FIELDS.user),
                    ]
                ),
                ExistsSeveralTimes(SettingClass(AVAILABLE_FIELDS.user), count=2),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Labbooks and Files - Unique calls",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.method, search="GET"),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                UniqueTogetherClass(
                    [
                        SettingClass(AVAILABLE_FIELDS.url, search=["/api/labbooks", "/api/files"]),
                        SettingClass(AVAILABLE_FIELDS.user),
                    ]
                ),
                ExistsSeveralTimes(SettingClass(AVAILABLE_FIELDS.user), count=2),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Labbooks and Tasks - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                UniqueTogetherClass(
                    [
                        SettingClass(AVAILABLE_FIELDS.url, search=["/api/labbooks", "/api/tasks"]),
                        SettingClass(AVAILABLE_FIELDS.user),
                    ]
                ),
                ExistsSeveralTimes(SettingClass(AVAILABLE_FIELDS.user), count=2),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
        SearchClass(
            "Labbooks and Files - Unique editors",
            general_statistic_settings
            + [
                SettingClass(AVAILABLE_FIELDS.method, search=["POST", "PUT", "PATCH"]),
                SettingClass(AVAILABLE_FIELDS.url, search="projects_recursive", equal=False),
                UniqueTogetherClass(
                    [
                        SettingClass(AVAILABLE_FIELDS.url, search=["/api/labbooks", "/api/files"]),
                        SettingClass(AVAILABLE_FIELDS.user),
                    ]
                ),
                ExistsSeveralTimes(SettingClass(AVAILABLE_FIELDS.user), count=2),
                SettingClass(AVAILABLE_FIELDS.user, unique=True),
            ],
        ),
    ]

    log_dir = "app-logs/"

    if "test" in sys.argv:
        log_dir = "/app/test-logs/"

    def handle(self, *args, **options):
        try:
            logs = []

            if "test" not in sys.argv:
                for file_name in os.listdir(self.log_dir):
                    full_path = os.path.join(self.log_dir, file_name)
                    if os.path.isfile(full_path) and "request_time_middleware" in file_name:
                        with open(full_path) as file:
                            while True:
                                file_line = file.readline().rstrip()
                                if file_line:
                                    file_line = file_line.replace(" ", "")
                                    logs.append(file_line)
                                else:
                                    break
            # Test logs:
            else:
                log_content = (
                    "DEBUG 2022-06-22T05:59:50.093714, request , 86fedccc-f1f0-11ec-83b3-0050568fadda, 1, "
                    "GET, /api/labbooks/8a4e3422-b6e5-468b-a457-78b67db409ee/privileges/3722/,"
                    " 0.0000 seconds, ; \
                                DEBUG 2022-06-22T05:59:50.232333, response, 86fedccc-f1f0-11ec-83b3-0050568fadda,"
                    " 2, GET, /api/labbooks/8a4e3422-b6e5-468b-a457-78b67db409ee/privileges/3722/,"
                    " 0.1386 seconds, by user1, status 200,  sent 1240 bytes ; \
                                DEBUG 2022-06-22T05:59:50.462488, response, 871ae084-f1f0-11ec-a0ba-0050568fadda,"
                    " 2, GET, /api/labbooks/8a4e3422-b6e5-468b-a457-78b67db409ee/,"
                    " 0.1852 seconds, by user2, status 200,  sent 2724 bytes ; \
                    DEBUG 2022-06-22T05:59:50.462488, response, 871ae084-f1f0-11ec-a0ba-0050568fadda,"
                    " 2, PATCH, /api/labbooks/8a4e3422-b6e5-468b-a457-78b67db409ee/,"
                    " 0.1852 seconds, by user2, status 200,  sent 2724 bytes ; \
                    DEBUG 2022-06-22T05:59:50.630671, response, 873e9eca-f1f0-11ec-9fe6-0050568fadda,"
                    " 2, GET, /api/labbooks/8a4e3422-b6e5-468b-a457-78b67db409ee/privileges/3722/,"
                    " 0.1191 seconds, by user1, status 200,  sent 1240 bytes ; \
                                DEBUG 2022-06-22T07:57:56.461288, response, 06a89d9a-f201-11ec-b6e7-0050568fadda,"
                    " 2, GET, /api/projects/569ed0dd-494d-4994-8bba-b5e0b5bd3e3f/,"
                    " 0.2368 seconds, by user3, status 200,  sent 6974 bytes ; \
                                DEBUG 2022-06-22T07:57:56.461288, response, 06a89d9a-f201-11ec-b6e7-0050568fadda,"
                    " 2, POST, /api/projects/, 0.2368 seconds, by user3, status 200,  sent 6974 bytes ; \
                                DEBUG 2022-06-22T07:57:56.461288, response, 06a89d9a-f201-11ec-b6e7-0050568fadda,"
                    " 2, PUT, /api/projects/569ed0dd-494d-4994-8bba-b5e0b5bd3e3f/, 0.2368 seconds,"
                    " by user4, status 200,  sent 6974 bytes ; \
                                DEBUG 2022-06-22T07:57:56.461288, response, 06a89d9a-f201-11ec-b6e7-0050568fadda,"
                    " 2, GET, /api/tasks/, 0.2368 seconds, by user1, status 200,  sent 6974 bytes ; \
                                DEBUG 2022-06-22T07:57:56.461288, response, 06a89d9a-f201-11ec-b6e7-0050568fadda,"
                    " 2, GET, /api/tasks/, 0.2368 seconds, by user2, status 200,  sent 6974 bytes ; \
                                DEBUG 2022-06-22T07:57:56.461288, response, 06a89d9a-f201-11ec-b6e7-0050568fadda,"
                    " 2, GET, /api/files/, 0.2368 seconds, by user4, status 200,  sent 6974 bytes ; \
                                DEBUG 2022-06-22T07:57:56.461288, response, 06a89d9a-f201-11ec-b6e7-0050568fadda,"
                    " 2, GET, /api/files/, 0.2368 seconds, by user4, status 200,  sent 6974 bytes ; \
                                DEBUG 2022-06-22T07:57:56.461288, response, 06a89d9a-f201-11ec-b6e7-0050568fadda,"
                    " 2, POST, /api/files/, 0.2368 seconds, by user2, status 200,  sent 6974 bytes"
                )
                logs = log_content.split(";")

            yesterday = get_yesterday()
            formatted_yesterday = datetime.strftime(yesterday, DATE_FORMAT)
            last_week_monday = get_last_week_monday()

            periods = [
                PeriodClass(formatted_yesterday, [formatted_yesterday], yesterday),
                PeriodClass(
                    datetime.strftime(last_week_monday, "%Y") + " Week " + str(last_week_monday.isocalendar()[1]),
                    get_last_week_days(),
                    last_week_monday,
                ),
            ]

            for period in periods:
                existing_period = Statistic.objects.filter(period=period.name)
                if not existing_period:
                    logs_in_period = handle_statistic_setting(
                        [SettingClass(AVAILABLE_FIELDS.date, search=period.days)], logs.copy()
                    )
                    for statistic in copy.deepcopy(self.statistics):
                        statistic_model = Statistic(
                            period=period.name,
                            name=statistic.name,
                            date=period.date,
                            count=len(handle_statistic_setting(statistic.settings, logs_in_period)),
                        )
                        statistic_model.save()
        except Exception as error:
            logger.error(error)
