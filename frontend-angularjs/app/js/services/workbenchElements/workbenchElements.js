/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('services');

    /**
     * provide a list of workbench elements
     */
    module.factory('workbenchElements', function (gettextCatalog) {
        'ngInject';

        /**
         * a dictionary that contains all workbench elements and their labels
         * @type {{}}
         */
        var workbenchElements = {
            'dmp.dmp': {
                'modelName': 'dmp',
                'translation': gettextCatalog.getString("DMP"),
                'translationPlural': gettextCatalog.getString("DMPs"),
                'icon': 'fa fa-pencil-square-o',
                'relatable': true,
                'exportable': true,
                'searchable': true,
                'labels': {
                    "name": gettextCatalog.getString("Name"),
                    "dmp_form": gettextCatalog.getString("Template"),
                    "status": gettextCatalog.getString("Status"),
                    "title": gettextCatalog.getString("Title"),
                    "dmp_form_data": gettextCatalog.getString("Data"),
                    "metadata": gettextCatalog.getString("Metadata")
                }
            },
            'labbooks.labbook': {
                'modelName': 'labbook',
                'translation': gettextCatalog.getString("LabBook"),
                'translationPlural': gettextCatalog.getString("LabBooks"),
                'icon': 'fa fa-book',
                'relatable': true,
                'exportable': true,
                'searchable': true,
                'labels': {
                    "title": gettextCatalog.getString("Title"),
                    "is_template": gettextCatalog.getString("Is Template"),
                    "child_elements": gettextCatalog.getString("Content"),
                    "description": gettextCatalog.getString("Description"),
                    "metadata": gettextCatalog.getString("Metadata")
                }
            },
            'labbooks.labbooksection': {
                'modelName': 'labbooksection',
                'translation': gettextCatalog.getString("LabbookSection"),
                'translationPlural': gettextCatalog.getString("LabbookSections"),
                'icon': 'fa fa-bars',
                'relatable': false,
                'exportable': false,
                'searchable': false,
                'labels': {
                    "title": gettextCatalog.getString("Title"),
                    "date": gettextCatalog.getString("Date"),
                    "child_elements": gettextCatalog.getString("Elements")
                }
            },
            'shared_elements.contact': {
                'modelName': 'contact',
                'translation': gettextCatalog.getString("Contact"),
                'translationPlural': gettextCatalog.getString("Contacts"),
                'icon': 'fa fa-address-book-o',
                'relatable': true,
                'exportable': true,
                'searchable': true,
                'labels': {
                    "phone": gettextCatalog.getString("Phone"),
                    "company": gettextCatalog.getString("Company"),
                    "email": gettextCatalog.getString("E-Mail"),
                    "academic_title": gettextCatalog.getString("Academic title"),
                    "first_name": gettextCatalog.getString("Firstname"),
                    "last_name": gettextCatalog.getString("Lastname"),
                    "metadata": gettextCatalog.getString("Metadata")
                }
            },
            'shared_elements.file': {
                'modelName': 'file',
                'translation': gettextCatalog.getString("File"),
                'translationPlural': gettextCatalog.getString("Files"),
                'icon': 'fa fa-file-o',
                'relatable': true,
                'exportable': true,
                'searchable': true,
                'labels': {
                    "name": gettextCatalog.getString("Title"),
                    "directory": gettextCatalog.getString("Folder"),
                    "file_size": gettextCatalog.getString("File size"),
                    "path": gettextCatalog.getString("Path"),
                    "mime_type": gettextCatalog.getString("Mime type"),
                    "original_filename": gettextCatalog.getString("Filename"),
                    "description": gettextCatalog.getString("Description"),
                    "metadata": gettextCatalog.getString("Metadata")
                }
            },
            'shared_elements.meeting': {
                'modelName': 'meeting',
                'translation': gettextCatalog.getString("Meeting"),
                'translationPlural': gettextCatalog.getString("Meetings"),
                'icon': 'fa fa-calendar',
                'relatable': true,
                'exportable': true,
                'searchable': true,
                'labels': {
                    "attending_contacts": gettextCatalog.getString("Attending contacts"),
                    "attending_users": gettextCatalog.getString("Attending users"),
                    "date_time_end": gettextCatalog.getString("End date"),
                    "date_time_start": gettextCatalog.getString("Start date"),
                    "resource": gettextCatalog.getString("Resource"),
                    "text": gettextCatalog.getString("Description"),
                    "title": gettextCatalog.getString("Title"),
                    "location": gettextCatalog.getString("Location"),
                    "metadata": gettextCatalog.getString("Metadata")
                }
            },
            'shared_elements.note': {
                'modelName': 'note',
                'translation': gettextCatalog.getString("Comment"),
                'translationPlural': gettextCatalog.getString("Comments"),
                'icon': 'fa fa-comment-o',
                'relatable': true,
                'exportable': true,
                'searchable': true,
                'labels': {
                    "content": gettextCatalog.getString("Content"),
                    "subject": gettextCatalog.getString("Subject"),
                    "metadata": gettextCatalog.getString("Metadata")
                }
            },
            'shared_elements.task': {
                'modelName': 'task',
                'translation': gettextCatalog.getString("Task"),
                'translationPlural': gettextCatalog.getString("Tasks"),
                'icon': 'fa fa-tasks',
                'relatable': true,
                'exportable': true,
                'searchable': true,
                'labels': {
                    "description": gettextCatalog.getString("Description"),
                    "priority": gettextCatalog.getString("Priority"),
                    "state": gettextCatalog.getString("State"),
                    "assigned_users": gettextCatalog.getString("Assignee"),
                    "assigned_user": gettextCatalog.getString("Assignee"),
                    "due_date": gettextCatalog.getString("Due date"),
                    "start_date": gettextCatalog.getString("Start Date"),
                    "title": gettextCatalog.getString("Title"),
                    "task_id": gettextCatalog.getString("Task ID"),
                    "checklist_items": gettextCatalog.getString("Checklist"),
                    "labels": gettextCatalog.getString("Labels"),
                    "metadata": gettextCatalog.getString("Metadata")
                }
            },
            'projects.project': {
                'modelName': 'project',
                'translation': gettextCatalog.getString("Project"),
                'translationPlural': gettextCatalog.getString("Projects"),
                'icon': 'fa fa-book',
                'relatable': true,
                'exportable': false,
                'searchable': true,
                'labels': {
                    "user": gettextCatalog.getString("User"),
                    "parent_project": gettextCatalog.getString("Parent Project"),
                    "description": gettextCatalog.getString("Description"),
                    "start_date": gettextCatalog.getString("Start date"),
                    "stop_date": gettextCatalog.getString("Stop date"),
                    "storage_space": gettextCatalog.getString("Storage space"),
                    "role": gettextCatalog.getString("Role"),
                    "name": gettextCatalog.getString("Title"),
                    "project_state": gettextCatalog.getString("State")
                }
            },
            'projects.projectroleuserassignment': {
                'modelName': 'projectroleuserassignment',
                'translation': gettextCatalog.getString("Project Member"),
                'translationPlural': gettextCatalog.getString("Project Members"),
                'icon': 'fa fa-user',
                'relatable': false,
                'exportable': false,
                'searchable': false,
                'labels': {
                    "role": gettextCatalog.getString("Role"),
                    "user": gettextCatalog.getString("User")
                }
            },
            'projects.resource': {
                'modelName': 'resource',
                'translation': gettextCatalog.getString("Resource"),
                'translationPlural': gettextCatalog.getString("Resources"),
                'icon': 'fa fa-cubes',
                'relatable': false,
                'exportable': true,
                'searchable': true,
                'labels': {
                    "name": gettextCatalog.getString("Name"),
                    "description": gettextCatalog.getString("Description"),
                    "type": gettextCatalog.getString("Type"),
                    "responsible_unit": gettextCatalog.getString("Responsible Unit"),
                    "location": gettextCatalog.getString("Location"),
                    "contact": gettextCatalog.getString("Contact"),
                    "terms_of_use_pdf": gettextCatalog.getString("Terms of use PDF"),
                    "projects": gettextCatalog.getString("Projects"),
                    "user_availability": gettextCatalog.getString("User availability"),
                    "user_availability_selected_users": gettextCatalog.getString("User availability selected users"),
                    "user_availability_selected_user_groups": gettextCatalog
                        .getString("User availability selected user groups"),
                    "metadata": gettextCatalog.getString("Metadata")
                }
            },
            'pictures.picture': {
                'modelName': 'picture',
                'translation': gettextCatalog.getString("Picture"),
                'translationPlural': gettextCatalog.getString("Pictures"),
                'icon': 'fa fa-picture-o',
                'relatable': true,
                'exportable': true,
                'searchable': true,
                'labels': {
                    "rendered_image": gettextCatalog.getString("Rendered Image"),
                    "background_image": gettextCatalog.getString("Background Image"),
                    "download_rendered_image": gettextCatalog.getString("Preview"),
                    "title": gettextCatalog.getString("Title"),
                    "shapes_image": gettextCatalog.getString("Shapes"),
                    "width": gettextCatalog.getString("Width"),
                    "height": gettextCatalog.getString("Height"),
                    "metadata": gettextCatalog.getString("Metadata")
                }
            },
            'kanban_boards.kanbanboard': {
                'modelName': 'kanbanboard',
                'translation': gettextCatalog.getString("Task Board"),
                'translationPlural': gettextCatalog.getString("Task Boards"),
                'icon': 'fa fa-columns',
                'relatable': true,
                'exportable': true,
                'searchable': true,
                'labels': {
                    "title": gettextCatalog.getString("Title"),
                    "board_type": gettextCatalog.getString("Board Type"),
                    "kanban_board_columns": gettextCatalog.getString("Columns")
                }
            },
            'drives.drive': {
                'modelName': 'drive',
                'translation': gettextCatalog.getString("Storage"),
                'translationPlural': gettextCatalog.getString("Storages"),
                'icon': 'fa fa-hdd-o',
                'relatable': true,
                'exportable': true,
                'searchable': true,
                'labels': {
                    "title": gettextCatalog.getString("Title"),
                    "sub_directories": gettextCatalog.getString("Folders"),
                    "metadata": gettextCatalog.getString("Metadata")
                }
            }
        };

        return {
            'elements': workbenchElements
        };
    });
})();
