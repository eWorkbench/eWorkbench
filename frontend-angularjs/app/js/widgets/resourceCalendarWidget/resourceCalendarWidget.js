/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    module.component('resourceCalendarWidget', {
        templateUrl: 'js/widgets/resourceCalendarWidget/resourceCalendarWidget.html',
        controller: 'ResourceCalendarWidgetController',
        controllerAs: 'vm',
        bindings: {
            calendarConfig: '<',
            selectedResource: '<',
            isStudyRoom: '<'
        }
    });

    module.controller('ResourceCalendarWidgetController', function (
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
        AuthRestService,
        ScheduleHelperService,
        ResourceHelperService,
        ResourceBookingCreateEditModalService,
        ResourceBookingsRestService,
        PermissionService,
        DebounceService
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
                    'resourcebooking': "vm.schedulesDict['" + entry.pk + "']"
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
        var viewRender = DebounceService.debounce(function (view, element) {
            if (view) {
                vm.viewStartTime = view.start.local(); // .local to get local format of date
                vm.viewEndTime = view.end.local().subtract(1, 'seconds'); // .local to get local format of date

                vm.getResourceBookings();
            }
        }, 500);

        /**
         * creates a new resource-booking on a select-event (Click and/or Drag on calendar)
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

            // create a resourcebooking-template
            var template = {
                date_time_start: start,
                date_time_end: end,
                full_day: fullDay
            };

            // create a modal and wait for a result
            var modal = ResourceBookingCreateEditModalService.openCreate(template, vm.selectedResource, vm.isStudyRoom);

            modal.result.then().catch(
                function () {
                    console.log("Modal canceled");
                }
            );
        };

        /**
         * edits a resourcebooking on a click-event for url 'resourcebooking'
         */
        var onEventClick = function (eventObj, jsEvent, view) {
            // don't open the url if the url is 'resourcebooking'
            jsEvent.preventDefault();

            // delete eventObj.source.events to avoid cycles
            delete eventObj.source.events;

            // check a second time if the user has edit permissions for the appointment
            eventObj.editable = PermissionService.has('object.edit', eventObj);

            // this will be the third check to get the actual permission
            if (!eventObj.editable) {
                eventObj.editable = PermissionService.has('object.edit', eventObj);
                if (!eventObj.editable) {
                    return;
                }
            }

            // create a modal and wait for a result
            var modal = ResourceBookingCreateEditModalService.openEdit(eventObj, vm.isStudyRoom);

            modal.result.then(function () {
                vm.getResourceBookings();
            });
        };

        this.$onInit = function () {
            /**
             * get current user
             */
            vm.user = AuthRestService.getCurrentUser();

            // refresh the user
            vm.user.$get();

            /**
             * a list of Appointments and Tasks
             * @type {Array}
             */
            vm.schedules = [];

            /**
             * dictionary for rendering the tooltip text of the resourcebooking
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
            vm.calendarConfig.selectable = true;
            vm.calendarConfig.eventRender = renderToolTip;
            vm.calendarConfig.eventClick = onEventClick;
            vm.calendarConfig.eventDurationEditable = false;
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
                bookresource: {
                    //click on the button opens the schedule overview page.
                    //The correct url is defined in the attribute: vm.calendarConfig.href
                    text: gettextCatalog.getString("Book Resource"),
                    click: function () {
                        $scope.$apply(function () {
                            vm.bookResource();
                        });
                    }
                },
                bookroom: {
                    //click on the button opens the schedule overview page.
                    //The correct url is defined in the attribute: vm.calendarConfig.href
                    text: gettextCatalog.getString("Book Room"),
                    click: function () {
                        $scope.$apply(function () {
                            vm.bookResource();
                        });
                    }
                }
            };
        };

        vm.getScheduleQueryFactory = function (hideDateFilters) {
            var queryFactory = FilteredScheduleQueryFactory
                .createQuery()
                .filterProjects(vm.selectedProjects)
                .searchText(vm.searchField);

            if (!hideDateFilters) {
                queryFactory.filterDateRange(vm.viewStartTime, vm.viewEndTime);
            }

            return queryFactory;
        };

        // is triggered when the resource was booked (resourceBookWidget.js)
        $rootScope.$on("resource-booked", function (event, args) {
            vm.getResourceBookings();
        });

        // is triggered when the resource was deleted, trashed or restored (genericDeleteMenu.js)
        $scope.$on('objectDeletedEvent', function () {
            vm.getResourceBookings();
        });

        /**
         *
         * get the calendar url
         */
        vm.getCalUrl = function () {
            var filters = vm.getScheduleQueryFactory(true).filters;

            MyScheduleRestServiceExport.doExport(filters);
        };

        /**
         * get resource bookings for vm.selectedResource
         */
        vm.getResourceBookings = function () {
            if (!vm.selectedResource) {
                return;
            }

            var filters = {
                resource: vm.selectedResource.pk
            };

            if (vm.viewStartTime && vm.viewEndTime) {
                filters['end_date__gte'] = vm.viewStartTime.toISOString();
                filters['start_date__lte'] = vm.viewEndTime.toISOString();
            }

            ResourceBookingsRestService.query(filters).$promise.then(
                function success (response) {
                    var schedules = [];

                    for (var j = 0; j < response.length; j++) {
                        var meeting = response[j];

                        meeting.booking = true;

                        // we will actually have to do this check three times as the PermissionService sometimes
                        // returns undefined and false first before returning the actual permission
                        // the other two times are located in the onEventClick function
                        meeting.editable = PermissionService.has('object.edit', meeting);

                        if (meeting.created_by && meeting.created_by.pk === vm.user.pk) {
                            meeting.borderColor = '#d2cdc8';
                            meeting.textColor = 'black';
                            meeting.color = ResourceHelperService.getResourceColor(meeting, vm.selectedResource.pk);
                            meeting.doubleKlick = false;
                        } else if (!meeting.created_by) {
                            // booked resource info (anonymous)
                            meeting.color = '#ccc';
                            meeting.textColor = '#555';
                        } else {
                            meeting.doubleKlick = true;
                            meeting.textColor = 'white';
                            meeting.color = ResourceHelperService.selectColor(9);
                        }
                        vm.schedulesDict[meeting.pk] = meeting;
                        schedules.push(meeting);
                    }
                    vm.schedules = angular.copy(schedules);
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load resourcebookings"));
                });
        };

        /**
         * Book a resource
         */
        vm.bookResource = function () {
            // create a modal and wait for a result
            var modal = ResourceBookingCreateEditModalService.openCreate(null, vm.selectedResource, vm.isStudyRoom);

            modal.result.then().catch(
                function () {
                    console.log("Modal canceled");
                }
            );
        };
    });
})();
