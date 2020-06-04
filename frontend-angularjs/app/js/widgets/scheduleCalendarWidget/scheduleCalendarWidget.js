/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    module.component('scheduleCalendarWidget', {
        templateUrl: 'js/widgets/scheduleCalendarWidget/scheduleCalendarWidget.html',
        controller: 'ScheduleCalendarWidgetController',
        controllerAs: 'vm',
        bindings: {
            selectedProjects: '<?',
            searchField: '<?',
            showTasks: '<?',
            showMeetings: '<?',
            selectedUsers: '<?',
            calendarConfig: '<',
            preSelectedUsers: '=',
            selectedResources: "<?"
        }
    });

    module.controller('ScheduleCalendarWidgetController', function (
        $scope,
        $rootScope,
        $state,
        $timeout,
        FilteredScheduleQueryFactory,
        MyScheduleRestService,
        $q,
        toaster,
        gettextCatalog,
        $compile,
        MyScheduleRestServiceExport,
        ScheduleHelperService,
        ResourceHelperService,
        ResourceBookingCreateEditModalService,
        meetingCreateModalService,
        ResourceBookingsRestService
    ) {
        'ngInject';

        var vm = this;

        /**
         * render the tooltip of an calendar element
         * @param entry
         * @param element
         * @param view
         */
        var renderToolTip = function (entry, element, view) {
            if (entry.content_type_model === "shared_elements.meeting") {
                element.attr({
                    'calendar-tooltip-widget': '',
                    'event': "vm.schedulesDict['" + entry.pk + "']"
                });

                $compile(element)($scope);
            } else if (entry.content_type_model === "shared_elements.task") {
                element.attr({
                    'calendar-tooltip-widget': '',
                    'task': "vm.schedulesDict['" + entry.pk + "']"
                });

                $compile(element)($scope);
            }
        };

        /**
         * This callback will get triggered when the user changes the view of the calendar, or when any of the date
         * navigation methods are called (prev, next, month, week, today).
         * @param view
         * @param element
         */
        var viewRender = function (view, element) {
            if (view) {
                vm.viewStartTime = view.start.local(); // .local to get local format of date
                vm.viewEndTime = view.end.local().subtract(1, 'seconds'); // .local to get local format of date

                vm.updateSchedules();
            }
        };

        /**
         * creates a new appointment on a select-event (Click and/or Drag on calendar)
         */
        var onSelectRange = function (startDate, endDate) {
            var fullDay = false;

            // selectable returns a date with an ambiguous timezone which leads to a timestamp where the
            // tz-difference is erroneously added (e.g. selected time + 2h),
            // therefore we first format it to a string
            // to start with exactly the time that was selected by the user
            //
            // also endDate is "next day 00:00", so we need to strip one minute to
            // actually get "selected day 23:59"

            var start = moment(startDate.format());
            var end = moment(endDate.format());

            if (startDate.hasTime() === false) {
                end = moment(endDate.subtract(1, 'minutes').format());
                fullDay = true;
            }

            // create an appointment-template
            var template = {
                date_time_start: start,
                date_time_end: end,
                full_day: fullDay
            };

            // create a modal and wait for a result
            var modal = meetingCreateModalService.open(template);

            modal.result.then(
                function success (response) {
                    var newMeeting = angular.copy(response);

                    newMeeting.textColor = "black";
                    newMeeting.color = "#ffe1c9";
                    newMeeting.borderColor = "#e9c6ab";
                    vm.schedules.push(newMeeting);
                    vm.updateSchedules();
                }, function error (rejection) {
                    console.log("MeetingCreateModalService canceled");
                });
        };

        this.$onInit = function () {
            /**
             * a list of Appointments and Tasks
             * @type {Array}
             */
            vm.schedules = [];

            /**
             * Filtered appointments and tasks list (auto generated based on filters)
             * @type {Array}
             */
            vm.filteredSchedules = [];

            /**
             * Whether or not tasks and appointments have finished loading
             * @type {boolean}
             */
            vm.schedulesLoaded = false;

            /**
             * dictionary for rendering the tooltip text of the task or appointment
             */
            vm.schedulesDict = {};

            /**
             * start date of the date range which is currently shown by the calendar
             * @type {undefined}
             */
            vm.viewStartTime = undefined;

            /**
             * end date of the date range which is currently shown by the calendar
             */
            vm.viewEndTime = undefined;

            /**
             * extend calendar configuration specific for schedules calendar
             */
            vm.calendarConfig = angular.copy(vm.calendarConfig);
            vm.calendarConfig.viewRender = viewRender;
            vm.calendarConfig.select = onSelectRange;
            // add appointment with specific time-/daterange by click&drag in calendar
            vm.calendarConfig.selectable = true;
            vm.calendarConfig.eventRender = renderToolTip;
            vm.calendarConfig.customButtons = { //add functionality to custom button 'Export' and 'Schedules'
                export: {
                    text: gettextCatalog.getString("Export"),
                    click: function () {
                        //export button
                        $scope.$apply(function () {
                            vm.getCalUrl();
                        });
                    }
                },
                schedule: {
                    //click on the button opens the schedule overview page.
                    //The correct url is defined in the attribute: vm.calendarConfig.href
                    text: gettextCatalog.getString("My Calendar")
                }
            };
            //defines the url which is opened by click on button 'schedules' (see fullCaledarCustomButtons.js)
            vm.calendarConfig.href = $state.href('schedule', {filterProjects: vm.selectedProjects});
        };

        vm.getScheduleQueryFactory = function (hideDateFilters) {
            var queryFactory = FilteredScheduleQueryFactory
                .createQuery()
                .filterProjects(vm.selectedProjects)
                .showMeetings(vm.showMeetings)
                .showTasks(vm.showTasks)
                .searchText(vm.searchField);

            if (!hideDateFilters) {
                queryFactory.filterDateRange(vm.viewStartTime, vm.viewEndTime);
            }

            return queryFactory;
        };

        /**
         * Update Filtered tasks and appointments
         * resets vm.filteredSchedules to an empty array, and then iterates over all schedules
         * Applies the following filters:
         * - filterBySelectedUser (assigned_users, attending_users)
         */
        var updateFilteredSchedules = function () {
            vm.filteredSchedules = [];

            for (var i = 0; i < vm.schedules.length; i++) {
                var schedule = vm.schedules[i];

                var showInFilteredProjects = ScheduleHelperService
                    .scheduleContainsAllWantedUsers(schedule, vm.selectedUsers);

                if (showInFilteredProjects) {
                    schedule.color = ResourceHelperService.getResourceColor(schedule, vm.selectedResources);

                    vm.filteredSchedules.push(schedule);
                }
            }
        };

        /**
         * updates schedules based on the response of the api and the filtering by user
         */
        vm.updateSchedules = function () {
            // only load data when parameters are given
            if (vm.viewStartTime && vm.viewEndTime && vm.selectedProjects) {
                var promise = vm.getScheduleQueryFactory(false).query();

                promise.then(function (response) {
                    var
                        i = 0,
                        responseLength = response.length;

                    // List of users which is pre-filled based on the schedules (attending users of the appointment,
                    // assigned users of the task) fetched from REST API
                    vm.preSelectedUsers.length = 0;

                    for (i = 0; i < responseLength; i++) {
                        var entry = response[i];

                        //for rendering the tooltip text
                        vm.schedulesDict[entry.pk] = entry;

                        switch (entry.content_type_model) {
                            case 'shared_elements.meeting':
                                //opened view by click on appointment
                                entry.url = $state.href('meeting-view', {meeting: entry});

                                //for display
                                entry.color = '#badee0';
                                entry.borderColor = '#8fc3c6';
                                entry.textColor = 'black';

                                //collect users that are attended to appointments
                                vm.preSelectedUsers = vm.preSelectedUsers.concat(entry.attending_users);
                                break;

                            case 'shared_elements.task':
                                //opened view by click on task
                                entry.url = $state.href('task-view', {task: entry});

                                //for display
                                entry.color = '#88bcc0';
                                entry.borderColor = '#79adb1';
                                entry.textColor = 'black';
                                // set tasks only as allDay when allDaySlot was enabled in the calendarConfig
                                if (vm.calendarConfig.allDaySlot && vm.calendarConfig.allDaySlot === true) {
                                    entry.allDay = true;
                                }

                                //collect users that are assigned to tasks
                                vm.preSelectedUsers = vm.preSelectedUsers.concat(entry.assigned_users);
                                break;

                            default:
                                entry.color = 'green';
                                break;
                        }
                    }

                    vm.schedules = response;
                    vm.addAdditionalResourceBookings();
                    vm.schedulesLoaded = true;
                    updateFilteredSchedules();

                }, function (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load schedules"));
                });
            }
        };

        /**
         * get the calendar url
         */
        vm.getCalUrl = function () {
            var filters = vm.getScheduleQueryFactory(true).filters;

            MyScheduleRestServiceExport.doExport(filters);
        };

        // Watch potential filter settings and update vm.filteredSchedules
        $scope.$watchGroup(
            ["vm.searchField", "vm.showTasks", "vm.showMeetings", "vm.selectedProjects"],
            vm.updateSchedules
        );
        // Watch potential filter settings and update vm.filteredSchedules
        $scope.$watchGroup(
            ["vm.selectedUsers", "vm.selectedResources"],
            updateFilteredSchedules
        );

        /**
         * get additional resource bookings when selected from the filter
         */
        vm.addAdditionalResourceBookings = function () {
            if (vm.selectedResources && vm.selectedResources.length > 0) {

                var schedules = vm.schedules;

                for (var i = 0; i < vm.selectedResources.length; i++) {
                    ResourceBookingsRestService.query({
                        resource: vm.selectedResources[i].pk,
                        end_date__gte:  vm.viewStartTime.toISOString(),
                        start_date__lte: vm.viewEndTime.toISOString()
                    }).$promise.then(
                        function success (response) {
                            for (var j = 0; j < response.length; j++) {
                                var booking = response[j];

                                booking.additional = true;

                                //opened view by click on appointment
                                booking.url = $state.href('meeting-view', {meeting: booking});

                                booking.borderColor = '#d2cdc8';
                                booking.textColor = 'black';
                                booking.color = ResourceHelperService.selectColor(vm.selectedResources.length);

                                booking.booked_by = booking.created_by;

                                var alreadyInSchedule = false;

                                for (var k = 0; k < schedules.length; k++) {
                                    if (schedules[k].pk === booking.pk) {
                                        alreadyInSchedule = true;
                                    }
                                }
                                if (!alreadyInSchedule) {
                                    vm.schedulesDict[booking.pk] = booking;
                                    schedules.push(booking);
                                }
                            }
                            vm.schedules = schedules;
                            updateFilteredSchedules();
                        },
                        function error (rejection) {
                            toaster.pop('error', gettextCatalog.getString("Could not load resourcebookings"));
                        }
                    );
                }
            }
        };

        /**
         * Watch vm.showMeetings and remove the resource filters if set to false
         */
        $scope.$watch("vm.showMeetings", function (newVal, oldVal) {
            if (newVal !== oldVal && newVal === false) {
                $rootScope.$emit("schedule:removeSelectedResources");
            }
        });

        /**
         * Watch vm.selectedResources and add additional resource bookings
         */
        $scope.$watch("vm.selectedResources", function () {
            vm.addAdditionalResourceBookings();
        });

        /**
         * When a resource is removed from the selection remove its additional bookings
         */
        $rootScope.$on("resource-removed-from-selection", function (event, args) {
            var resource_pk = args.resource_pk;
            var indexes = [];

            // iterate through vm.schedules to find indexes of additional bookings that should now be removed
            for (var i = 0; i < vm.schedules.length; i++) {
                if (vm.schedules[i].resource
                    && vm.schedules[i].resource.pk === resource_pk
                    && vm.schedules[i].additional
                    && vm.schedules[i].content_type_model === 'shared_elements.meeting') {

                    var index = vm.schedules.indexOf(vm.schedules[i]);

                    if (index >= 0) {
                        indexes.push(index);
                    }
                }
            }
            // remove the indexed elements from vm.schedules
            while (indexes.length) {
                vm.schedules.splice(indexes.pop(), 1);
            }
            updateFilteredSchedules();
        });
    });
})();
