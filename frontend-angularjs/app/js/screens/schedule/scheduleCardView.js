/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Schedule List as cards
     */
    module.component('scheduleCardView', {
        templateUrl: 'js/screens/schedule/scheduleCardView.html',
        controller: 'ScheduleCardViewController',
        controllerAs: 'vm',
        bindings: {
            selectedProjects: '<?',
            searchField: '<?',
            showMyTasks: '<?',
            showMyMeetings: '<?',
            selectedUsers: '<?',
            preSelectedUsers: '='
        }
    });

    /**
     * Controller for schedule list as cards
     */
    module.controller('ScheduleCardViewController', function (
        $timeout,
        FilteredScheduleQueryFactory,
        ScheduleHelperService,
        moment,
        gettextCatalog,
        MyScheduleRestService,
        $q,
        $scope,
        toaster,
        AuthRestService
    ) {
        "ngInject";
        var vm = this;

        this.$onInit = function () {
            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();
            /**
             * a dictionary of Appointments and Tasks which where received by the API group by months
             * It contains:
             *  start: start date of the month
             *  end: end date of the month
             *  label: text which is displayed (Month, Year)
             *  list: list of appointments and tasks
             *        when no data is available then noDataAvailableEntry
             */
            vm.schedules = {};

            /**
             * a dictionary of filtered appointments and tasks (auto generated based on filters) group by months
             * It contains:
             *  start: start date of the month
             *  end: end date of the month
             *  label: text which is displayed (Month, Year)
             *  list: list of appointments and tasks
             *        when no data is available then noDataAvailableEntry
             */
            vm.filteredSchedules = {};

            /**
             * Whether or not tasks and appointments have finished loading
             * @type {boolean}
             */
            vm.schedulesLoaded = false;

            /**
             * start date of the whole date range which was requested from the api
             * initial is the first day of the current week
             */
            vm.viewStartTime = undefined;

            /**
             * end date of the whole date range which was requested from the api
             * initial is it the last day of 4 weeks in the future
             */
            vm.viewEndTime = undefined;

            /**
             * indicates that currently data is loaded and no other data should be loaded (used by infinite scroll)
             * @type {boolean}
             */
            vm.infiniteScrollIsLoading = false;

            /**
             * indicates that currently data is loaded and no other data should be loaded (used by load previous data)
             * @type {boolean}
             */
            vm.previousDataIsLoading = false;

            /**
             * contains the keys of the dictionary vm.filteredSchedules
             * used for sorting those dictionary by keys (key is an unique identifier of year and month)
             * @type {Array}
             */
            vm.listOfKeys = [];
        };

        /**
         * for grouping the entries after month and year of the start date
         * @param schedule
         */
        vm.groupByMonths = function (date) {
            return moment(date).format("gggg-MM"); //gggg -> local week year
        };

        /**
         * displayed label for the list which is grouped by month and year
         * @param date
         */
        vm.getFormattedLabel = function (date) {
            return moment(date).format("MMMM, gggg"); //gggg -> local week year
        };

        /**
         * get all schedule entries based on the filter from the api
         */
        vm.getSchedules = function (startTime, endTime) {
            return FilteredScheduleQueryFactory
                .createQuery()
                .filterProjects(vm.selectedProjects)
                .filterDateRange(startTime, endTime)
                .showMeetings(vm.showMyMeetings, vm.currentUser.pk, vm.selectedUsers)
                .showMyTasks(vm.showMyTasks)
                .searchText(vm.searchField)
                .query();
        };

        /**
         *  creates a noDataAvailable entry for display
         *  Those entries are created when no appointments for a whole month exists
         */
        var getNoDataAvailableEntry = function (startTimeOfMonth) {
            return [
                {
                    'start': startTimeOfMonth,
                    'end': moment(startTimeOfMonth).endOf('month'),
                    'content_type_model': "noDataAvailable"
                }
            ];
        };

        /**
         * Update Filtered tasks and appointments
         * resets vm.filteredSchedules to an empty dictionary, gets from vm.schedules for each month the
         * appointments and iterates over them (vm.schedules[i].list).
         *
         * Add a noDataAvailable entry for each month if necessary (no appointments exists in this month anymore)
         */
        var updateFilteredSchedules = function () {
            vm.filteredSchedules = {};
            var keys = Object.keys(vm.schedules);

            for (var i = 0; i < keys.length; i++) {
                var filteredSchedulesValues = [];

                var monthStartTime = vm.schedules[keys[i]].start;

                var filteredScheduleObject = {
                    'start': monthStartTime,
                    'end': vm.schedules[keys[i]].end,
                    'label': vm.schedules[keys[i]].label
                };

                // iterate over the appointments for one month
                var values = vm.schedules[keys[i]].list;

                for (var j = 0; j < values.length; j++) {
                    var schedule = values[j];

                    // apply the filters
                    var scheduleIsNoDuplicate = ScheduleHelperService
                        .scheduleIsNoDuplicate(schedule, filteredSchedulesValues);

                    // add entry when filter fits
                    if (scheduleIsNoDuplicate) {
                        filteredSchedulesValues.push(schedule);
                    }
                }

                // add noDataAvailable entry if necessary
                if (filteredSchedulesValues.length === 0) {
                    filteredScheduleObject['list'] = getNoDataAvailableEntry(monthStartTime);
                } else {
                    filteredScheduleObject['list'] = filteredSchedulesValues;
                }
                vm.filteredSchedules[keys[i]] = filteredScheduleObject;
            }
            // saves all keys - used for odering the list after year and month
            vm.listOfKeys = Object.keys(vm.filteredSchedules);
        };

        /**
         * List of users which is pre-filled based on the schedules fetched from REST API
         * (attending users of the appointment, assigned users of the task)
         * @param data
         */
        var preFillListOfUsers = function (data) {
            var users = ScheduleHelperService.getUsersOfSchedules(data);

            vm.preSelectedUsers.concat(users);
        };

        /**
         * fills the dictionary vm.schedules with all necessary data
         * @param data
         * @param startTime
         * @param endTime
         */
        var fillListOfData = function (data, startTime, endTime) {
            vm.scheduleObject = {
                'start': startTime,
                'end': endTime,
                'label': vm.getFormattedLabel(startTime)
            };
            //when no appointment exists for this month add the noDataAvailable entry
            if (data.length === 0) {
                vm.scheduleObject['list'] = getNoDataAvailableEntry(startTime);
            } else {
                vm.scheduleObject['list'] = data;
            }
            // key of dictionary is a unique key of year and month
            vm.schedules[vm.groupByMonths(startTime)] = vm.scheduleObject;
        };

        /**
         * updates schedules based on the response of the api and overrides the old data
         * the method is called initial for loading the first data and then when api filters change
         * (eg. project, fts,...)
         * loads always the data in the date range from vm.viewStartTime to vm.viewEndTime
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

                    vm.schedules = {};
                    fillListOfData(response, vm.viewStartTime, vm.viewEndTime);
                    updateFilteredSchedules();

                    vm.schedulesLoaded = true;

                }, function (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load schedules"));
                });
            }
        };

        /**
         * called when new data should be loaded for infinite scroll
         * loads always the next month and add it to the existing data
         * additional the vm.viewEndTime was changed to the last date which is displayed
         */
        vm.infiniteScroll = function () {
            if (vm.infiniteScrollIsLoading === true) {
                return;
            }
            vm.infiniteScrollIsLoading = true;

            if (vm.viewStartTime && vm.viewEndTime && vm.selectedProjects) {
                //only a local start time to know at which date the api call should start
                var newStartTime = moment(vm.viewEndTime).add(1, 'minute').startOf('month');

                //changes the global end time
                vm.viewEndTime = moment(vm.viewEndTime).add(1, 'minute').endOf('month');

                var promise = vm.getSchedules(newStartTime, vm.viewEndTime);

                promise.then(function (response) {
                    preFillListOfUsers(response);

                    fillListOfData(response, newStartTime, vm.viewEndTime);
                    updateFilteredSchedules();

                    vm.infiniteScrollIsLoading = false;

                }, function (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load schedules"));
                    vm.infiniteScrollIsLoading = false;
                });
            }
        };

        /**
         * called when previous data should be loaded
         * loads always the previous month of vm.viewStartTime and add it to the existing data
         * Additional the vm.viewStartTime was changed to the first date which is displayed
         */
        vm.loadPreviousData = function () {
            if (vm.previousDataIsLoading === true) {
                return;
            }
            vm.previousDataIsLoading = true;

            if (vm.viewStartTime && vm.viewEndTime && vm.selectedProjects) {
                //only a local end time to know at which date the api call should end
                var newEndTime = moment(vm.viewStartTime).subtract(1, 'minute').endOf('month');

                //changes the global start time
                vm.viewStartTime = moment(vm.viewStartTime).subtract(1, 'minute').startOf('month');

                var promise = vm.getSchedules(vm.viewStartTime, newEndTime);

                promise.then(function (response) {
                    preFillListOfUsers(response);

                    fillListOfData(response, vm.viewStartTime, newEndTime);
                    updateFilteredSchedules();

                    vm.previousDataIsLoading = false;

                }, function (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load schedules"));
                    vm.previousDataIsLoading = false;
                });
            }
        };

        // Watch potential filter settings and update vm.filteredSchedules
        $scope.$watchGroup(
            ["vm.searchField", "vm.showMyTasks", "vm.showMyMeetings", "vm.selectedUsers", "vm.selectedProjects"],
            vm.updateSchedules
        );

        // Watch potential filter settings and update vm.filteredSchedules
        $scope.$watchGroup(
            ["vm.selectedResources"],
            updateFilteredSchedules
        );
    });
})();
