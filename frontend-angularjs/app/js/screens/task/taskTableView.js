/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Task list as a table
     */
    module.component('taskTableView', {
        templateUrl: 'js/screens/task/taskTableView.html',
        controller: 'TaskTableViewController',
        controllerAs: 'vm',
        bindings: {
            'tasks': '<',
            // Sorting
            'orderBy': '=',
            'orderDir': '='
        }
    });

    module.controller('TaskTableViewController', function (
        gettextCatalog,
        UserListSortService
    ) {
        var vm = this;

        this.$onInit = function () {
            var idColumn = {
                name: gettextCatalog.getString("ID"),
                displayName: gettextCatalog.getString("ID"),
                field: 'task_id',
                cellTemplate: '<task-link task="row.entity">'
                    + '#{{ row.entity.task_id }}'
                    + '</task-link>'
            };

            var priorityColumn = {
                name: gettextCatalog.getString("Priority"),
                field: 'priority',
                cellTemplate: '<div>'
                    + '<task-state-priority-display-widget task-priority="row.entity.priority">'
                    + '</task-state-priority-display-widget>'
                    + '</div>'
            };

            var titleColumn = {
                name: gettextCatalog.getString("Task Title"),
                field: 'title',
                cellTemplate: '<task-link task="row.entity" title="{{row.entity.title}}">'
                    + '{{ row.entity.title }}'
                    + '</task-link>'
            };

            var stateColumn = {
                name: gettextCatalog.getString("State"),
                field: 'state',
                cellTemplate: '<div>'
                    + '<task-state-priority-display-widget task-state="row.entity.state">'
                    + '</task-state-priority-display-widget>'
                    + '</div>'

            };

            var startDateColumn = {
                name: gettextCatalog.getString("Start date"),
                field: 'start_date',
                cellTemplate: '<div>{{ row.entity.start_date | smallDate }}</div>'
            };

            var dueDateColumn = {
                name: gettextCatalog.getString("Due Date"),
                field: 'due_date',
                cellTemplate: '<div>{{ row.entity.due_date | smallDate }}</div>'
            };

            var assignedUsersColumn = {
                name: gettextCatalog.getString("Assigned to"),
                field: 'assigned_users',
                cellTemplate: '<div>'
                    + '<task-assigned-users-cell-widget task="row.entity">'
                    + '</task-assigned-users-cell-widget>'
                    + '</div>',
                sortingAlgorithm: UserListSortService.sortAlgorithm
            };

            var trashColumn = {
                name: gettextCatalog.getString("Trash"),
                headerCellTemplate: '<div></div>',
                enableColumnMenu: false,
                enableSorting: false,
                enableHiding: false,
                cellTemplate: '<div class="text-center">'
                    + '<generic-delete-menu-widget model-object="row.entity">'
                    + '</generic-delete-menu-widget>'
                    + '</div>'
            };

            vm.gridOptions = {
                data: vm.tasks,
                enableGridMenu: true,
                enableColumnResizing: true,
                enablePaginationControls: false,
                rowHeight: 30,
                columnDefs: [
                    idColumn,
                    priorityColumn,
                    titleColumn,
                    stateColumn,
                    startDateColumn,
                    dueDateColumn,
                    assignedUsersColumn,
                    trashColumn
                ]
            };
        };
    });
})();
