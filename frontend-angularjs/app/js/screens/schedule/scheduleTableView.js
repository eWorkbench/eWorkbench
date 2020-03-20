/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Schedule List as list
     */
    module.component('scheduleListView', {
        templateUrl: 'js/screens/schedule/scheduleTableView.html',
        controller: 'ScheduleListViewController',
        controllerAs: 'vm',
        bindings: {
            selectedProjects: '<?',
            searchField: '<?',
            showTasks: '<?',
            showMyResourceBookings: '<?',
            showMeetings: '<?',
            selectedUsers: '<?',
            preSelectedUsers: '='
        }
    });

    /**
     * Controller for schedule list as list
     */
    module.controller('ScheduleListViewController', function (
        $timeout,
        FilteredScheduleQueryFactory,
        ScheduleHelperService,
        moment,
        gettextCatalog,
        MyScheduleRestService,
        $q,
        $scope,
        toaster,
        UserSortService
    ) {
        "ngInject";
        var vm = this;

        this.$onInit = function () {
            /**
             * a list of Meetings and Tasks which where received by the API
             */
            vm.schedules = [];

            /**
             * a list of filtered meetings and tasks (auto generated based on filters)
             */
            vm.filteredSchedules = [];

            /**
             * Whether or not tasks and meetings have finished loading
             * @type {boolean}
             */
            vm.schedulesLoaded = false;

            /**
             * default sort column
             */
            vm.sortColumn = "start";

            /**
             * Default Sort order
             * @type {boolean}
             */
            vm.sortReverse = false;

            var titleColumn = {
                name: gettextCatalog.getString("Title"),
                field: 'title',
                cellTemplate: '<schedule-element-link entity="row.entity">' +
                    '</schedule-element-link>'
            };

            var startColumn = {
                name: gettextCatalog.getString("Start time"),
                field: 'start',
                cellTemplate: '<div>{{ row.entity.start | smallDate }}</div>'
            };

            var endColumn = {
                name: gettextCatalog.getString("End time"),
                field: 'end',
                cellTemplate: '<div>{{ row.entity.end | smallDate }}</div>'
            };

            var createdAtColumn = {
                name: gettextCatalog.getString("Created at"),
                field: 'created_at',
                cellTemplate: '<div>{{ row.entity.created_at | smallDate }}</div>'
            };

            var createdByColumn = {
                name: gettextCatalog.getString("Created by"),
                field: 'created_by',
                cellTemplate: '<div ng-if="row.entity.created_by">' +
                    '<user-display-widget user="row.entity.created_by">' +
                    '</user-display-widget>' +
                    '</div>',
                sortingAlgorithm: UserSortService.sortAlgorithm
            };

            var lastModifiedAtColumn = {
                name: gettextCatalog.getString("Last updated at"),
                field: 'last_modified_at',
                cellTemplate: '<div>{{ row.entity.last_modified_at | smallDate }}</div>'
            };

            var lastModifiedByColumn = {
                name: gettextCatalog.getString("Last updated by"),
                field: 'last_modified_by',
                cellTemplate: '<div ng-if="row.entity.last_modified_by">' +
                    '<user-display-widget user="row.entity.last_modified_by">' +
                    '</user-display-widget>' +
                    '</div>',
                sortingAlgorithm: UserSortService.sortAlgorithm
            };

            vm.gridOptions = {
                data: vm.meetings,
                enableSorting: true,
                enableGridMenu: true,
                enableColumnResizing: true,
                rowHeight: 30,
                columnDefs: [
                    titleColumn,
                    startColumn,
                    endColumn,
                    createdAtColumn,
                    createdByColumn,
                    lastModifiedAtColumn,
                    lastModifiedByColumn
                ]
            };
        };
        /**
         * get all schedule entries based on the filter from the api
         */
        vm.getSchedules = function (startTime, endTime) {
            return FilteredScheduleQueryFactory
                .createQuery()
                .filterProjects(vm.selectedProjects)
                .filterDateRange(startTime, endTime)
                .showMeetings(vm.showMeetings)
                .showTasks(vm.showTasks)
                .showMyResourceBookings(vm.showMyResourceBookings)
                .searchText(vm.searchField)
                .query();
        };

        /**
         * Update Filtered tasks and meetings
         * resets vm.filteredSchedules to an empty list, iterates over the appointments
         * in vm.schedules.
         * Applies the following filters:
         * - filterBySelectedUser (assigned_users, attending_users)
         *
         */
        var updateFilteredSchedules = function () {
            vm.filteredSchedules = [];

            for (var i = 0; i < vm.schedules.length; i++) {
                vm.schedules[i].type = vm.schedules[i].content_type_model.split('.')[1];

                // apply the filters
                var showInFilteredProjects = ScheduleHelperService.scheduleContainsAllWantedUsers(
                    vm.schedules[i],
                    vm.selectedUsers
                );

                // add entry when filter fits
                if (showInFilteredProjects) {
                    vm.filteredSchedules.push(vm.schedules[i]);
                }
            }
            vm.gridOptions.data = vm.filteredSchedules;
        };

        /**
         * List of users which is pre-filled based on the schedules fetched from REST API
         * (attending users of the meeting, assigned users of the task)
         * @param data
         */
        var preFillListOfUsers = function (data) {
            var users = ScheduleHelperService.getUsersOfSchedules(data);

            vm.preSelectedUsers.concat(users);
        };


        /**
         * updates schedules based on the response of the api and overrides the old data
         * the method is called initial for loading the first data and then when api filters change
         * (eg. project, fts,...)
         */
        vm.updateSchedules = function () {
            vm.viewStartTime = moment().startOf('month'); //start of currentMonth
            vm.viewEndTime = moment().endOf('month'); // end of currentMonth

            // only load data when parameters are given
            if (vm.viewStartTime && vm.viewEndTime && vm.selectedProjects) {
                var promise = vm.getSchedules(vm.viewStartTime, vm.viewEndTime);

                promise.then(function (response) {
                    vm.preSelectedUsers.length = 0;
                    preFillListOfUsers(response);

                    vm.schedules = [];
                    vm.schedules = response;
                    updateFilteredSchedules();

                    vm.gridOptions.data = vm.filteredSchedules;

                    vm.schedulesLoaded = true

                }, function (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load schedules"));
                });
            }
        };

        // Watch potential filter settings and load the new data from the api
        $scope.$watchGroup(
            ["vm.searchField", "vm.showTasks", "vm.showMeetings", "vm.showMyResourceBookings", "vm.selectedProjects"],
            vm.updateSchedules
        );
        // Watch potential filter settings and filter the data local (no api call)
        $scope.$watchGroup(
            ["vm.selectedUsers"],
            updateFilteredSchedules
        );
    });
})();
