/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    module.factory('DefaultTableStates', function () {
        var trashColumn = {
            "name": "Trash",
            "sort": {},
            "width": 20,
            "filters": [{}],
            "visible": true
        };

        var exportColumn = {
            "name": "Export",
            "sort": {},
            "width": 20,
            "filters": [{}],
            "visible": true
        };

        // grid-ui does not provide a way to restore to the initial state, so there they are, hard-coded
        return {
            "grid_state_projects":
                {
                    "columns": [
                        {
                            "name": "Expand",
                            "field": "pk",
                            "visible": true,
                            "width": 25,
                            "sort": {},
                            "filters": [{}]
                        },
                        {
                            "name": "Project Name",
                            "field": "name",
                            "visible": true,
                            "width": "*",
                            "sort": {"direction": "desc"},
                            "filters": [{}]
                        },
                        {
                            "name": "Progress",
                            "field": "tasks_status",
                            "visible": true,
                            "width": "25%",
                            "sort": {},
                            "filters": [{}]
                        },
                        {
                            "name": "Start Date",
                            "field": "start_date",
                            "visible": true,
                            "width": "10%",
                            "sort": {},
                            "filters": [{}]
                        },
                        {
                            "name": "Stop Date",
                            "field": "stop_date",
                            "visible": true,
                            "width": "10%",
                            "sort": {},
                            "filters": [{}]
                        },
                        {
                            "name": "Done",
                            "field": "tasks_status_completed",
                            "visible": true,
                            "width": "10%",
                            "sort": {},
                            "filters": [{}]
                        },
                        {
                            "name": "Status",
                            "field": "project_state",
                            "visible": true,
                            "width": "10%",
                            "sort": {},
                            "filters": [{}]
                        },
                        trashColumn
                    ],
                    "scrollFocus": {},
                    "selection": [],
                    "grouping": {},
                    "treeView": {},
                    "pagination": {}
                },
            "grid_state_dmps": {
                "columns": [
                    {
                        "name": "Title",
                        "field": "title",
                        "sort": {"direction": "asc"},
                        "width": "40%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "DMP Template",
                        "field": "dmp_form",
                        "sort": {},
                        "width": "15%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Status",
                        "field": "status",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated at",
                        "field": "last_modified_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated by",
                        "field": "last_modified_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    trashColumn
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_files": {
                "columns": [
                    {
                        "name": "Title",
                        "field": "title",
                        "sort": {"direction": "asc"},
                        "width": "25%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "File Name",
                        "field": "name",
                        "sort": {},
                        "width": "25%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "File size",
                        "field": "file_size",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Mime type",
                        "field": "mime_type",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    trashColumn
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_notes": {
                "columns": [
                    {
                        "name": "Subject",
                        "field": "subject",
                        "sort": {"direction": "asc"},
                        "width": "50%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    trashColumn
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_plugininstances": {
                "columns": [
                    {
                        "name": "Title",
                        "field": "title",
                        "sort": {"direction": "desc"},
                        "width": "15%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Plugin Type",
                        "field": "plugintype",
                        "sort": {},
                        "width": "15%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Rawdata",
                        "field": "rawdata",
                        "sort": {},
                        "width": "10%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Picture Representation",
                        "field": "picture",
                        "sort": {},
                        "width": "10%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated at",
                        "field": "last_modified_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated by",
                        "field": "last_modified_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    trashColumn
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_tasks": {
                "columns": [
                    {
                        "name": "ID",
                        "field": "task_id",
                        "sort": {"direction": "asc"},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Priority",
                        "field": "priority",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Task Title",
                        "field": "title",
                        "sort": {},
                        "width": "40%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "State",
                        "field": "state",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Start date",
                        "field": "start_date",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Due Date",
                        "field": "due_date",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Assigned to",
                        "field": "assigned_users",
                        "sort": {},
                        "width": "20%",
                        "filters": [{}],
                        "visible": true
                    },
                    trashColumn
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_relations": {
                "columns": [
                    {
                        "name": "Relation Name",
                        "sort": {},
                        "width": "50%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Type",
                        "sort": {},
                        "width": "15%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Linked by",
                        "field": "created_by",
                        "sort": {},
                        "width": "15%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Linked at",
                        "field": "created_at",
                        "sort": {"direction": "desc"},
                        "width": "15%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Tools",
                        "sort": {},
                        "width": "3%",
                        "filters": [{}],
                        "visible": true
                    }
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_history": {
                "columns": [
                    {
                        "name": "Expand",
                        "sort": {},
                        "width": 25,
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Name",
                        "sort": {},
                        "width": "60%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Type",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Change",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Date",
                        "sort": {"direction": "asc"},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "User",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_contacts": {
                "columns": [
                    {
                        "name": "Firstname",
                        "field": "first_name",
                        "sort": {"direction": "asc"},
                        "width": "25%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Lastname",
                        "field": "last_name",
                        "sort": {},
                        "width": "25%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "E-Mail",
                        "field": "email",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Academic title",
                        "field": "academic_title",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    {
                        "name": "Phone",
                        "field": "phone",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    {
                        "name": "Company",
                        "field": "company",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    trashColumn
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_labbooks": {
                "columns": [
                    {
                        "name": "Title",
                        "field": "title",
                        "sort": {"direction": "asc"},
                        "width": "50%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated at",
                        "field": "last_modified_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated by",
                        "field": "last_modified_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    trashColumn
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_meetings": {
                "columns": [
                    {
                        "name": "Title",
                        "field": "title",
                        "sort": {},
                        "width": "30%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Location",
                        "field": "location",
                        "sort": {},
                        "width": "20%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Start Time",
                        "field": "date_time_start",
                        "sort": {"direction": "asc"},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "End Time",
                        "field": "date_time_end",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Attending users",
                        "field": "attending_users",
                        "sort": {},
                        "width": "20%",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated at",
                        "field": "last_modified_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    {
                        "name": "Last updated by",
                        "field": "last_modified_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    trashColumn
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_pictures": {
                "columns": [
                    {
                        "name": "Title",
                        "field": "title",
                        "sort": {"direction": "asc"},
                        "width": "50%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated at",
                        "field": "last_modified_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated by",
                        "field": "last_modified_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Height",
                        "field": "height",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    {
                        "name": "Width",
                        "field": "width",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    trashColumn
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_resources": {
                "columns": [
                    {
                        "name": "Name",
                        "field": "name",
                        "sort": {"direction": "asc"},
                        "width": "40%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Type",
                        "field": "type",
                        "sort": {},
                        "width": 150,
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Description",
                        "field": "description",
                        "sort": {},
                        "width": "30%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Location",
                        "field": "location",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Contact",
                        "field": "contact",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    {
                        "name": "Responsible unit",
                        "field": "responsible_unit",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    {
                        "name": "User availability",
                        "field": "user_availability",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    {
                        "name": "Duplicate",
                        "sort": {},
                        "width": 20,
                        "filters": [{}],
                        "visible": true
                    },
                    trashColumn,
                    {
                        "name": "Book",
                        "sort": {},
                        "width": 50,
                        "filters": [{}],
                        "visible": true
                    }
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {
                    "paginationPageSize": 16,
                    "paginationCurrentPage": 1
                },
                "scrollFocus": {}
            },
            "grid_state_schedules": {
                "columns": [
                    {
                        "name": "Title",
                        "sort": {},
                        "width": "50%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Start time",
                        "sort": {"direction": "asc"},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "End time",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    {
                        "name": "Last updated by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    }
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_kanbanboards": {
                "columns": [
                    {
                        "name": "Title",
                        "field": "title",
                        "sort": {"direction": "asc"},
                        "width": "50%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated at",
                        "field": "last_modified_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    {
                        "name": "Last updated by",
                        "field": "last_modified_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    trashColumn
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_resourcebookings": {
                "columns": [
                    {
                        "name": "Resource Name",
                        "field": "resource__name",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Resource Type",
                        "field": "resource__type",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Resource Location",
                        "field": "resource__location",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    }, {
                        "name": "Resource Description",
                        "field": "resource__description",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    }, {
                        "name": "Appointment",
                        "field": "title",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Appointment attending users",
                        "field": "attending_users",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Booked From",
                        "field": "date_time_start",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Booked To",
                        "field": "date_time_end",
                        "sort": {"direction": "asc"},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Appointment Description",
                        "field": "text",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    }, {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    }, exportColumn, trashColumn, {
                        "name": "Rebook",
                        "sort": {},
                        "width": 60,
                        "filters": [{}],
                        "visible": true
                    }
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_resourcebookings_detail": {
                "columns": [
                    {
                        "name": "Resource Name",
                        "field": "resource__name",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Resource Type",
                        "field": "resource__type",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Resource Location",
                        "field": "resource__location",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    }, {
                        "name": "Resource Description",
                        "field": "resource__description",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    }, {
                        "name": "Appointment",
                        "field": "title",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Appointment attending users",
                        "field": "attending_users",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Booked From",
                        "field": "date_time_start",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Booked To",
                        "field": "date_time_end",
                        "sort": {"direction": "asc"},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Appointment Description",
                        "field": "text",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    }, {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    }, {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    }, exportColumn, trashColumn, {
                        "name": "Rebook",
                        "sort": {},
                        "width": 60,
                        "filters": [{}],
                        "visible": true
                    }
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            },
            "grid_state_dsscontainers": {
                "columns": [
                    {
                        "name": "Name",
                        "field": "name",
                        "sort": {"direction": "asc"},
                        "width": "20%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Path",
                        "field": "path",
                        "sort": {},
                        "width": "20%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Read Write Setting",
                        "field": "read_write_setting",
                        "sort": {},
                        "width": "10%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Import Option",
                        "field": "import_option",
                        "sort": {},
                        "width": "10%",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created at",
                        "field": "created_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Created by",
                        "field": "created_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": true
                    },
                    {
                        "name": "Last updated at",
                        "field": "last_modified_at",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    },
                    {
                        "name": "Last updated by",
                        "field": "last_modified_by",
                        "sort": {},
                        "width": "*",
                        "filters": [{}],
                        "visible": false
                    }
                ],
                "grouping": {},
                "treeView": {},
                "selection": [],
                "pagination": {},
                "scrollFocus": {}
            }
        };
    });
})();
