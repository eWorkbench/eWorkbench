/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Appointment list as a table
     */
    module.component('meetingTableView', {
        templateUrl: 'js/screens/meeting/meetingTableView.html',
        controller: 'MeetingTableViewController',
        controllerAs: 'vm',
        bindings: {
            'meetings': '<',
            'searchField': '<',
            // Sorting
            'orderBy': '=',
            'orderDir': '='
        }
    });

    /**
     * Controller for appointments as a table
     */
    module.controller('MeetingTableViewController', function (
        gettextCatalog,
        uiGridConstants,
        UserSortService,
        UserListSortService
    ) {
        var vm = this;

        this.$onInit = function () {
            var titleColumn = {
                name: gettextCatalog.getString("Title"),
                field: 'title',
                cellTemplate: '<meeting-link meeting="row.entity" title="{{row.entity.title}}">'
                    + '</meeting-link>'
            };

            var locationColumn = {
                name: gettextCatalog.getString("Location"),
                field: 'location',
                cellTemplate: '<div title="{{ row.entity.location }}">' +
                    '{{ row.entity.location }}</div>'
            };

            var startTimeColumn = {
                name: gettextCatalog.getString("Start Time"),
                field: 'date_time_start',
                cellTemplate: '<div>{{ row.entity.date_time_start | smallDate}}</div>'
            };

            var endTimeColumn = {
                name: gettextCatalog.getString("End Time"),
                field: 'date_time_end',
                cellTemplate: '<div>{{ row.entity.date_time_end | smallDate}}</div>'
            };

            var attendingUsersColumn = {
                name: gettextCatalog.getString("Attending users"),
                field: 'attending_users',
                width: '20%',
                cellTemplate: '<div><meeting-attending-users-cell-widget meeting="row.entity">' +
                    '</meeting-attending-users-cell-widget></div>',
                sortingAlgorithm: UserListSortService.sortAlgorithm
            };

            var createdAtColumn = {
                name: gettextCatalog.getString("Created at"),
                field: 'created_at',
                cellTemplate: '<div>{{ row.entity.created_at | smallDate}}</div>'
            };

            var createdByColumn = {
                name: gettextCatalog.getString("Created by"),
                field: 'created_by',
                cellTemplate: '<div ng-if="row.entity.created_by">' +
                    '<user-display-widget user="row.entity.created_by"></user-display-widget></div>',
                sortingAlgorithm: UserSortService.sortAlgorithm
            };

            var lastModifiedAtColumn = {
                name: gettextCatalog.getString("Last updated at"),
                field: 'last_modified_at',
                cellTemplate: '<div>{{ row.entity.last_modified_at | smallDate}}</div>'
            };

            var lastModifiedByColumn = {
                name: gettextCatalog.getString("Last updated by"),
                field: 'last_modified_by',
                cellTemplate: '<div ng-if="row.entity.last_modified_by">' +
                    '<user-display-widget user="row.entity.last_modified_by"></user-display-widget></div>',
                sortingAlgorithm: UserSortService.sortAlgorithm
            };

            var trashColumn = {
                name: gettextCatalog.getString("Trash"),
                headerCellTemplate: '<div></div>',
                enableColumnMenu: false,
                enableSorting: false,
                enableHiding: false,
                cellTemplate: '<div class="text-center"><generic-delete-menu-widget model-object="row.entity">' +
                    '</generic-delete-menu-widget></div>'
            };

            vm.gridOptions = {
                data: vm.meetings,
                enableSorting: true,
                enableGridMenu: true,
                enableColumnResizing: true,
                rowHeight: 30,
                columnDefs: [
                    titleColumn,
                    locationColumn,
                    startTimeColumn,
                    endTimeColumn,
                    attendingUsersColumn,
                    createdAtColumn,
                    createdByColumn,
                    lastModifiedAtColumn,
                    lastModifiedByColumn,
                    trashColumn
                ]
            };
        };
    });
})();
