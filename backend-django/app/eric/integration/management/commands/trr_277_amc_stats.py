#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import csv

from django.core.management.base import BaseCommand
from django.db.models import Sum
from django.utils import timezone

from dateutil.relativedelta import relativedelta

from eric.dmp.models import Dmp
from eric.drives.models import Drive
from eric.projects.models import Project
from eric.shared_elements.models import File
from eric.versions.models import Version

# ssh -J srvadm@tuzebib-wb-load.srv.mwn.de srvadm@tuzebib-wb-work.srv.mwn.de
# su - ge29nax
# cd /var/django/ericworkbench/ && . venv/bin/activate && cd app
# python manage.py trr_277_amc_stats --settings=eric.settings.tum_live
# ls
# -- disconnect from ssh and rsync the file seen in the ls command above accordingly
# rsync -azv -e 'ssh -A -J srvadm@tuzebib-wb-load.srv.mwn.de'
# srvadm@tuzebib-wb-work.srv.mwn.de:/var/django/ericworkbench/app/trr_277_amc_stats-{timestamp}.csv
# ~/Schreibtisch/trr_277_amc_stats-{timestamp}.csv --progress


CSV_HEADERS = [
    "Level",
    "Project",
    # Project
    "Project Name",
    "Project ID",
    # DMP
    "DMP Name",
    "DMP ID",
    "DMP last updated timestamp",
    "DMP remarks IDs (e.g. version_summary = V1)",
    # Storage
    "Storage Name",
    "Storage ID",
    "File last updated timestamp",
    "File last updated ID",
    "File remarks IDs (e.g. version_summary = V1)",
    # Storage space usage, counts, file extensions
    "Total size of files (bytes)",
    "Total size of files created in the last three months (bytes)",
    "Total number of files",
    "Total number of files created in the last three months",
    "File extensions",
]

LEVEL3_DATA = {}
LEVEL2_TEMP_DATA = {}
LEVEL2_DATA = {}
LEVEL1_DATA = {}


def get_dmp_data(project_id, project_name, level):
    dmps = (
        Dmp.objects.filter(
            projects=project_id,
            title__startswith=project_name,
        )
        .filter(title__icontains="WP_")
        .order_by("title")
    )
    for dmp in dmps:
        version_remark_versions = Version.objects.filter(object_id=dmp.pk).filter(
            summary__regex=r"^V\d+",
        )
        version_remarks = ""
        if version_remark_versions:
            version_remarks = version_remark_versions.values_list("object_id", flat=True)

        last_updated = dmp.last_modified_at
        LEVEL3_DATA[dmp.pk] = [
            level,  # 1, 2 or 3
            "NO",
            # Project
            project_name,
            project_id,
            # DMP
            dmp.title,
            dmp.pk,
            last_updated.isoformat(),
            version_remarks,
            # Storage
            "",
            "",
            "",
            "",
            "",
            # Storage space usage, counts, file extensions
            "",
            "",
            "",
            "",
            "",
        ]
    return


def get_storage_data(project_id, project_name, level):
    storages = (
        Drive.objects.filter(
            projects=project_id,
            title__startswith=project_name,
        )
        .filter(title__icontains="workspace")
        .order_by("title")
    )
    for storage in storages:
        all_files_in_storage = File.objects.filter(directory__drive__pk=storage.pk)
        file_last_updated = all_files_in_storage.order_by("-last_modified_at").first()
        if file_last_updated:
            file_last_updated_last_modified_at = file_last_updated.last_modified_at.isoformat()
            file_last_updated_pk = file_last_updated.pk
        else:
            file_last_updated_last_modified_at = ""
            file_last_updated_pk = ""

        all_files_in_storage_pks = all_files_in_storage.values_list("pk", flat=True)
        version_remark_versions = Version.objects.filter(object_id__in=all_files_in_storage_pks).filter(
            summary__regex=r"^V\d+",
        )
        version_remarks = ""
        if version_remark_versions:
            version_remarks = version_remark_versions.values_list("object_id", flat=True)

        storage_size = all_files_in_storage.aggregate(Sum("file_size"))["file_size__sum"]
        files_last_three_months = all_files_in_storage.filter(created_at__gte=timezone.now() - relativedelta(months=3))
        storage_size_last_three_months = files_last_three_months.aggregate(Sum("file_size"))["file_size__sum"]

        number_of_files_last_three_months = files_last_three_months.count()

        extensions = set()
        for file in all_files_in_storage:
            extension = file.name.split(".")[-1]
            extensions.add(extension)

        LEVEL3_DATA[storage.pk] = [
            level,  # 1, 2 or 3
            "NO",
            # Project
            project_name,
            project_id,
            # DMP
            "",
            "",
            "",
            "",
            # Storage
            storage.title,
            storage.pk,
            file_last_updated_last_modified_at,
            file_last_updated_pk,
            version_remarks,
            # Storage space usage, counts, file extensions
            storage_size,
            storage_size_last_three_months,
            all_files_in_storage.count(),
            number_of_files_last_three_months,
            ", ".join(extensions),
        ]
    return


def get_level2_totals():
    for key, value in LEVEL3_DATA.items():
        total = value[1]
        level = value[0]
        if total == "YES" and level == "2":
            LEVEL2_TEMP_DATA[key] = value

    for key, value in LEVEL2_TEMP_DATA.items():
        project_name = value[2]
        dmp_last_updated_timestamp = None
        file_last_updated_timestamp = None
        file_filesize_total = 0
        file_filesize_last3months = 0
        file_number_total = 0
        file_number_last3months = 0
        for ikey, ivalue in LEVEL3_DATA.items():
            item_level = ivalue[0]
            item_name = ivalue[2]
            if item_name.startswith(project_name) and item_level == "3":
                current_dmp_last_updated_timestamp = ivalue[6]
                current_file_last_updated_timestamp = ivalue[10]
                current_file_filesize_total = ivalue[13]
                current_file_filesize_last3months = ivalue[14]
                current_file_number_total = ivalue[15]
                current_file_number_last3months = ivalue[16]
                if current_dmp_last_updated_timestamp and not dmp_last_updated_timestamp:
                    dmp_last_updated_timestamp = current_dmp_last_updated_timestamp
                if (
                    current_dmp_last_updated_timestamp
                    and dmp_last_updated_timestamp
                    and current_dmp_last_updated_timestamp > dmp_last_updated_timestamp
                ):
                    dmp_last_updated_timestamp = current_dmp_last_updated_timestamp
                if current_file_last_updated_timestamp and not file_last_updated_timestamp:
                    file_last_updated_timestamp = current_file_last_updated_timestamp
                if (
                    current_file_last_updated_timestamp
                    and file_last_updated_timestamp
                    and current_file_last_updated_timestamp > file_last_updated_timestamp
                ):
                    file_last_updated_timestamp = current_file_last_updated_timestamp
                if current_file_filesize_total:
                    file_filesize_total += int(current_file_filesize_total)
                if current_file_filesize_last3months:
                    file_filesize_last3months += int(current_file_filesize_last3months)
                if current_file_number_total:
                    file_number_total += int(current_file_number_total)
                if current_file_number_last3months:
                    file_number_last3months += int(current_file_number_last3months)
        LEVEL2_DATA[key] = [
            "2",  # 1, 2 or 3
            "YES",
            # Project
            project_name,
            value[3],
            # DMP
            value[4],
            value[5],
            dmp_last_updated_timestamp,
            value[7],
            # Storage
            value[8],
            value[9],
            file_last_updated_timestamp,
            value[11],
            value[12],
            # Storage space usage, counts, file extensions
            file_filesize_total,
            file_filesize_last3months,
            file_number_total,
            file_number_last3months,
            value[17],
        ]


def get_level1_totals(l1_project_id, l1_project_name):
    dmp_last_updated_timestamp = None
    file_last_updated_timestamp = None
    file_filesize_total = 0
    file_filesize_last3months = 0
    file_number_total = 0
    file_number_last3months = 0
    for key, value in LEVEL3_DATA.items():
        current_dmp_last_updated_timestamp = value[6]
        current_file_last_updated_timestamp = value[10]
        current_file_filesize_total = value[13]
        current_file_filesize_last3months = value[14]
        current_file_number_total = value[15]
        current_file_number_last3months = value[16]
        if current_dmp_last_updated_timestamp and not dmp_last_updated_timestamp:
            dmp_last_updated_timestamp = current_dmp_last_updated_timestamp
        if (
            current_dmp_last_updated_timestamp
            and dmp_last_updated_timestamp
            and current_dmp_last_updated_timestamp > dmp_last_updated_timestamp
        ):
            dmp_last_updated_timestamp = current_dmp_last_updated_timestamp
        if current_file_last_updated_timestamp and not file_last_updated_timestamp:
            file_last_updated_timestamp = current_file_last_updated_timestamp
        if (
            current_file_last_updated_timestamp
            and file_last_updated_timestamp
            and current_file_last_updated_timestamp > file_last_updated_timestamp
        ):
            file_last_updated_timestamp = current_file_last_updated_timestamp
        if current_file_filesize_total:
            file_filesize_total += int(current_file_filesize_total)
        if current_file_filesize_last3months:
            file_filesize_last3months += int(current_file_filesize_last3months)
        if current_file_number_total:
            file_number_total += int(current_file_number_total)
        if current_file_number_last3months:
            file_number_last3months += int(current_file_number_last3months)
    LEVEL1_DATA[l1_project_id] = [
        "1",  # 1, 2 or 3
        "YES",
        # Project
        l1_project_name,
        l1_project_id,
        # DMP
        "",
        "",
        dmp_last_updated_timestamp,
        "",
        # Storage
        "",
        "",
        file_last_updated_timestamp,
        "",
        "",
        # Storage space usage, counts, file extensions
        file_filesize_total,
        file_filesize_last3months,
        file_number_total,
        file_number_last3months,
        "",
    ]


def write_csv():
    now = timezone.now().isoformat()
    with open(f"trr_277_amc_stats-{now}.csv", "w", newline="") as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow(
            [
                "LEVEL 3",
            ]
        )
        csvwriter.writerow(CSV_HEADERS)
        for key, value in LEVEL3_DATA.items():
            csvwriter.writerow(value)
        csvwriter.writerow(
            [
                "LEVEL 2",
            ]
        )
        csvwriter.writerow(CSV_HEADERS)
        for key, value in LEVEL2_DATA.items():
            csvwriter.writerow(value)
        csvwriter.writerow(
            [
                "LEVEL 1",
            ]
        )
        csvwriter.writerow(CSV_HEADERS)
        for key, value in LEVEL1_DATA.items():
            csvwriter.writerow(value)


class Command(BaseCommand):
    help = "Prints statistics for the TRR_277_AMC project in csv format. python manage.py trr_277_amc_stats"

    def handle(self, *args, **options):
        # Level 1
        level_1_project = Project.objects.filter(pk="14f78906-d7d1-4555-b5d3-43d5b1ff9671").first()  # mptt level=0
        l1_project_id = level_1_project.pk
        l1_project_name = level_1_project.name
        get_dmp_data(l1_project_id, l1_project_name, "1")
        get_storage_data(l1_project_id, l1_project_name, "1")
        LEVEL3_DATA[l1_project_id] = [
            "1",  # 1, 2 or 3
            "YES",
            # Project
            l1_project_name,
            l1_project_id,
            # DMP
            "",
            "",
            "",
            "",
            # Storage
            "",
            "",
            "",
            "",
            "",
            # Storage space usage, counts, file extensions
            "",
            "",
            "",
            "",
            "",
        ]
        # Level 2
        level_2_projects = Project.objects.filter(parent_project=level_1_project).order_by("name")  # level=1
        for level_2_project in level_2_projects:
            l2_project_id = level_2_project.pk
            l2_project_name = level_2_project.name
            get_dmp_data(l2_project_id, l2_project_name, "2")
            get_storage_data(l2_project_id, l2_project_name, "2")
            LEVEL3_DATA[l2_project_id] = [
                "2",  # 1, 2 or 3
                "YES",
                # Project
                l2_project_name,
                l2_project_id,
                # DMP
                "",
                "",
                "",
                "",
                # Storage
                "",
                "",
                "",
                "",
                "",
                # Storage space usage, counts, file extensions
                "",
                "",
                "",
                "",
                "",
            ]
            # Level 3
            level_3_projects = level_2_project.get_descendants(include_self=False).order_by("name")
            for level_3_project in level_3_projects:
                l3_project_id = level_3_project.pk
                l3_project_name = level_3_project.name
                LEVEL3_DATA[l3_project_id] = [
                    "3",  # 1, 2 or 3
                    "YES",
                    # Project
                    l3_project_name,
                    l3_project_id,
                    # DMP
                    "",
                    "",
                    "",
                    "",
                    # Storage
                    "",
                    "",
                    "",
                    "",
                    "",
                    # Storage space usage, counts, file extensions
                    "",
                    "",
                    "",
                    "",
                    "",
                ]
                get_dmp_data(l3_project_id, l3_project_name, "3")
                get_storage_data(l3_project_id, l3_project_name, "3")
        get_level2_totals()
        get_level1_totals(l1_project_id, l1_project_name)
        write_csv()
