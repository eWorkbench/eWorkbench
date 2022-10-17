#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import csv
import statistics

from django.core.management import BaseCommand
from django.db.models import Count

from eric.core.models.abstract import WorkbenchEntityMixin, get_all_workbench_models
from eric.kanban_boards.models import KanbanBoardColumnTaskAssignment
from eric.model_privileges.models import ModelPrivilege
from eric.model_privileges.utils import get_model_privileges_and_project_permissions_for
from eric.projects.models import Project
from eric.shared_elements.models import Task


class Command(BaseCommand):
    help = "Prints various usage stats"

    def handle(self, *args, **options):
        # SITUMEWB-983: Statistik: Trashed Items
        all_workbench_models = get_all_workbench_models(WorkbenchEntityMixin)
        total_trashed_items = 0
        users_dict = {}
        for model in all_workbench_models:
            try:
                deleted_objects = model.objects.all().filter(deleted=True)
                total_trashed_items += deleted_objects.count()
                for deleted_object in deleted_objects:
                    model_privileges = get_model_privileges_and_project_permissions_for(model, deleted_object)
                    for model_privilege in model_privileges:
                        if model_privilege.full_access_privilege == ModelPrivilege.ALLOW:
                            user = model_privilege.user
                            user_pk = user.pk
                            if user_pk in users_dict.keys():
                                users_dict[user_pk] += 1
                            else:
                                users_dict[user_pk] = 1
            except Exception:
                pass
        print(f"Total trashed items: {total_trashed_items}")
        print(f"Total users who have trashed items: {len(users_dict)}")
        with open("trashed_items.csv", "w") as f:
            writer = csv.writer(f)
            writer.writerow(["User ID", "Trashed Items Count"])
            for k, v in users_dict.items():
                writer.writerow([k, v])
        value_list = list(users_dict.values())
        median = statistics.median(value_list)
        print(f"Max trashed items per user: {max(value_list)}")
        print(f"Min trashed items per user: {min(value_list)}")
        print(f"Median trashed items per user: {median}")
        print(f"Average trashed items per user: {sum(value_list)/len(value_list)}")

        # SITUMEWB-984: Statistik: Doppelte Taskboardzuweisung
        all_duplicate_tasks = (
            KanbanBoardColumnTaskAssignment.objects.values("task")
            .annotate(Count("id"))
            .order_by()
            .filter(id__count__gt=1)
        )
        total_tasks_users = {}
        try:
            for duplicate_task in all_duplicate_tasks:
                task = Task.objects.filter(pk=duplicate_task["task"]).first()
                task_privileges = get_model_privileges_and_project_permissions_for(Task, task)

                for task_privilege in task_privileges:
                    # check if view privilege is set
                    if task_privilege.full_access_privilege == ModelPrivilege.ALLOW:
                        user = task_privilege.user
                        user_pk = user.pk
                        if user_pk in total_tasks_users.keys():
                            total_tasks_users[user_pk] += 1
                        else:
                            total_tasks_users[user_pk] = 1
        except Exception:
            pass
        print(f"Total tasks in multiple taskboards: {len(all_duplicate_tasks)}")
        print(f"Total users who have tasks in multiple taskboards: {len(total_tasks_users)}")
        with open("tasks_in_multiple_taskboards.csv", "w") as f:
            writer = csv.writer(f)
            writer.writerow(["User ID", "Tasks In Multiple Taskboards Count"])
            for k, v in total_tasks_users.items():
                writer.writerow([k, v])
        task_value_list = list(total_tasks_users.values())
        median = statistics.median(task_value_list)
        print(f"Max number of tasks in multiple taskboards per user: {max(task_value_list)}")
        print(f"Min number of tasks in multiple taskboards per user: {min(task_value_list)}")
        print(f"Median number of tasks in multiple taskboards per user: {median}")
        print(f"Average number of tasks in multiple taskboards per user: {sum(task_value_list)/len(task_value_list)}")

        # SITUMEWB-985: Statistik: Projektzuweisung und Full Access
        total_objects_without_projects = 0
        total_project_users = {}
        for model in all_workbench_models:
            try:
                if model == Project:
                    projects_without_project = model.objects.all().filter(parent_project=None)
                    for project in projects_without_project:
                        model_privileges = get_model_privileges_and_project_permissions_for(model, project)
                        for model_privilege in model_privileges:
                            if model_privilege.full_access_privilege == ModelPrivilege.ALLOW:
                                user = model_privilege.user
                                user_pk = user.pk
                                if user_pk in total_project_users.keys():
                                    total_project_users[user_pk] += 1
                                else:
                                    total_project_users[user_pk] = 1
                    total_objects_without_projects += projects_without_project.count()
                else:
                    elements_without_projects = model.objects.all().filter(projects=None)
                    for element in elements_without_projects:
                        model_privileges = get_model_privileges_and_project_permissions_for(model, element)
                        for model_privilege in model_privileges:
                            if model_privilege.full_access_privilege == ModelPrivilege.ALLOW:
                                user = model_privilege.user
                                user_pk = user.pk
                                if user_pk in total_project_users.keys():
                                    total_project_users[user_pk] += 1
                                else:
                                    total_project_users[user_pk] = 1
                    total_objects_without_projects += elements_without_projects.count()

            except Exception:
                pass
        print(f"Total objects without project assignment: {total_objects_without_projects}")
        print(f"Total users who have objects without project assignment: {len(total_project_users)}")
        with open("items_without_project_assignment.csv", "w") as f:
            writer = csv.writer(f)
            writer.writerow(["User ID", "Items Without Project Assignment Count"])
            for k, v in total_project_users.items():
                writer.writerow([k, v])
        project_value_list = list(total_project_users.values())
        median = statistics.median(project_value_list)
        print(f"Max number of objects without project assignment per user: {max(project_value_list)}")
        print(f"Min number of objects without project assignment per user: {min(project_value_list)}")
        print(f"Median number of objects without project assignment per user: {median}")
        print(
            f"Average number of objects without project assignment per user: "
            f"{sum(project_value_list)/len(project_value_list)}"
        )
