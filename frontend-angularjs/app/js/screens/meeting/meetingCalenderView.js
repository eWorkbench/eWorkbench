/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Appointment List as calendar
     */
    module.component('meetingCalendarView', {
        templateUrl: 'js/screens/meeting/meetingCalenderView.html',
        controller: 'MeetingCalendarViewController',
        controllerAs: 'vm',
        bindings: {
            'meetings': '='
        }
    });

    /**
     * Controller for appointment list as cards
     */
    module.controller('MeetingCalendarViewController', function (
        $scope,
        $state,
        $timeout,
        $compile,
        CalendarConfigurationService,
        FileSaver,
        gettextCatalog,
        MeetingRestService,
        MeetingsRestServiceExport,
        toaster,
        uiCalendarConfig
    ) {
        "ngInject";

        var vm = this;

        var lang = "en";

        this.$onInit = function () {
            /**
             * set language
             */
            lang = CalendarConfigurationService.getOptions().locale;

            /**
             * contains the data for the ui calendar
             * @type {Array}
             */
            vm.calendarSources = [];

            /**
             * config of the ui calendar
             */
            vm.uiConfig = {
                calendar: {
                    height: "auto", // set calendar view to a natural height and no scrollbars are used
                    editable: true, // allows to edit meeting objects (drag and drop, resize)
                    header: {
                        left: 'title',
                        center: '',
                        right: 'today prev next export' //set buttons
                    },
                    buttonText: {
                        today: gettextCatalog.getString("Current week") //change text of the button 'today'
                    },
                    customButtons: {
                        export: {
                            text: 'Export',
                            click: function () {
                                //export button
                                $scope.$apply(function () {
                                    vm.exportCal();
                                });
                            }
                        }
                    },
                    timezone: 'local', //set the timezone to the local browser timezone
                    lang: lang, // set the language
                    firstDay: 1, // set the first day of the week (0=Sunday, 1=Monday,...)
                    timeFormat: 'HH:mm', // set the time-text of an object
                    slotLabelFormat: 'HH:mm', //set the time-text on the vertical axis of the agenda view
                    columnFormat: 'ddd, D.M.', // set the time-text on the column headings
                    titleFormat: 'MMMM D YYYY', //set the time-text on the headers title
                    minTime: '06:00:00', // set starting time of view
                    maxTime: '20:00:00', // set end time of view
                    weekNumbers: true, // week numbers are shown
                    defaultView: 'agendaWeek', // set the initial view
                    allDaySlot: false, // disable the display of the all day slot at the top of the calendar
                    // eventClick: vm.onEventClick, //handles the click on a element
                    eventDrop: vm.onDrop, // handles the drag and drop of an element
                    eventResize: vm.onResize, // handles the resize of an element
                    eventRender: vm.eventRender, // to display a tooltip text for an object
                    viewRender: vm.viewRender
                }
            };
        };

        /**
         * handles drag and drop on a calendar element
         * @param event
         * @param delta
         * @param revertFunc
         * @param jsEvent
         * @param ui
         * @param view
         */
        vm.onDrop = function (event, delta, revertFunc, jsEvent, ui, view) {
            vm.updateChanges(event);
        };

        /**
         * handles resize on a calendar element
         * @param event
         * @param delta
         * @param revertFunc
         * @param jsEvent
         * @param ui
         * @param view
         */
        vm.onResize = function (event, delta, revertFunc, jsEvent, ui, view) {
            vm.updateChanges(event);
        };

        vm.updateCalendarSources = function (newSources) {
            // update full calendar
            if (uiCalendarConfig.calendars['calendar']) {
                uiCalendarConfig.calendars['calendar'].fullCalendar('removeEvents');
                if (newSources) {
                    uiCalendarConfig.calendars['calendar'].fullCalendar('addEventSource', newSources);
                } else {
                    uiCalendarConfig.calendars['calendar'].fullCalendar('addEventSource', vm.calendarSources[0]);
                }
            }
        };

        /**
         * update the calendar element after drag and drop or resize
         * @param changedObject
         */
        vm.updateChanges = function (changedObject) {
            // changedObject.$update();
            // does not work as it contains a circular reference
            // therefore we need to find the object in calendarSources

            var changedData = {
                'pk': changedObject.pk,
                'date_time_start': changedObject.start,
                'date_time_end': changedObject.end
            };

            MeetingRestService.updatePartial(changedData).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Appointment updated"));
                },
                function error (rejection) {
                    // an error happened
                    toaster.pop('error', gettextCatalog.getString("Failed to update appointment"));
                    vm.meetingsDict[changedObject.pk].$get();

                    $timeout(vm.updateCalendarSources);
                }
            );
        };

        /**
         * render the tooltip of an calendar element
         * @param event
         * @param element
         * @param view
         */
        vm.eventRender = function ( event, element, view ) {
            console.log("rendering event?");
            //$('.tooltip').remove();
            element.attr({
                'calendar-tooltip-widget': '',
                'event': "vm.meetingsDict['" + event.pk + "']"
            });
            $compile(element)($scope);
        };

        /**
         * triggered when a new date range is rendered - user switches to other week
         */
        vm.viewRender = function () {
            vm.updateCalendarSources();
        };

        $scope.$watch("vm.meetings", function () {
            console.log("appointments changed");
            vm.meetingsDict = {};

            for (var i = 0; i < vm.meetings.length; i++) {
                //for rendering the tooltip text
                vm.meetingsDict[vm.meetings[i].pk] = vm.meetings[i];
            }

            //set appointments to calendar view
            vm.calendarSources = [vm.meetings];
            //update calendar view
            console.log("should update calendar view now...");

            $timeout(vm.updateCalendarSources);
        }, true);

        /**
         * export the calendar via REST API "export" function
         * this should deliver an ical file, which we download using "FileSaver"
         */
        vm.exportCal = function () {
            MeetingsRestServiceExport.export().then(function (response) {
                // get mime-type
                var mimeType = response.headers('content-type');
                //get the file name from the http content-disposition header
                var contentDisposition = response.headers('content-disposition');

                var data = new Blob([response.data], { type: mimeType + 'charset=utf-8' });

                vm.filename = contentDisposition.split("=")[1];

                //download file
                FileSaver.saveAs(data, vm.filename);
            });
        };
    });
})();
