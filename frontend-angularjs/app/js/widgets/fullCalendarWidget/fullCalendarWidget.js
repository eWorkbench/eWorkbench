/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     *  customizable full calendar widget
     */
    module.component('fullCalendarWidget', {
        templateUrl: 'js/widgets/fullCalendarWidget/fullCalendarWidget.html',
        controller: 'FullCalendarWidgetController',
        controllerAs: 'vm',
        bindings: {
            calendarConfig: '<',
            onEventChange: '=', // needs to be a promise
            useEventRender: '=?',
            useEventDrop: '<',
            useEventResize: '<',
            useViewRender: '=?',
            events: '<'
        }
    });

    // default configuration if no custom uiConfig is passed
    module.constant('FULL_CALENDAR_WIDGET_CONFIG', {
        height: 'auto', // set calendar view to a natural height and no scrollbars are used
        editable: false, // allows to edit meeting objects (drag and drop, resize)
        header: {
            left: 'title',
            center: '',
            right: 'month agendaWeek today prev next'
        },
        buttonText: {},
        customButtons: {},
        firstDay: 1, // set the first day of the week (0=Sunday, 1=Monday,...)
        timeFormat: 'HH:mm', // set the time-text of an object
        slotLabelFormat: 'HH:mm', //set the time-text on the vertical axis of the agenda view
        views: {
            week: {
                columnFormat: 'ddd, D.M.' // set the time-text on the column headings (only by month view)
            }
        },
        titleFormat: 'MMMM D YYYY', //set the time-text on the headers title
        minTime: '06:00:00', // set starting time of view
        maxTime: '20:00:00', // set end time of view
        weekNumbers: true, // week numbers are shown
        defaultView: 'agendaWeek', // set the initial view
        allDaySlot: false // disable the display of the all day slot at the top of the calendar
    });

    module.controller('FullCalendarWidgetController', function (
        FULL_CALENDAR_WIDGET_CONFIG,
        $scope,
        $compile,
        $timeout,
        gettextCatalog,
        uiCalendarConfig,
        toaster,
        CalendarConfigurationService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**list of events
             * @type {Array}
             */
            vm.events = [];

            vm.uiConfig = {calendar: {}};

            /**
             * sets the language
             */
            FULL_CALENDAR_WIDGET_CONFIG.lang = CalendarConfigurationService.getOptions().locale;

            /**
             * contains the data for the ui calendar
             * @type {Array}
             */
            vm.calendarSources = [];

            //
            /**
             * append watcher to the parent source provider
             */
            $scope.$watch('vm.events', function () {
                vm.calendarSources = [vm.events];
                $timeout(vm.updateCalendarSources);
            }, true);


            if (typeof vm.calendarConfig === 'undefined') {
                vm.calendarConfig = {};
            }

            // if the event render was not deactivated or not set
            if (vm.useEventRender !== false || typeof vm.useEventRender === 'undefined') {
                // if the event render is not provided by the customized config
                if (vm.calendarConfig.hasOwnProperty('eventRender') === false) {
                    // register the default event render
                    FULL_CALENDAR_WIDGET_CONFIG.eventRender = vm.eventRender;
                }
            }

            // if the event drop was not deactivated or not set
            if (vm.useEventDrop !== false || typeof vm.useEventDrop === 'undefined') {
                // if the event drop is not provided by the customized config
                if (vm.calendarConfig.hasOwnProperty('eventDrop') === false) {
                    // register the default event render
                    FULL_CALENDAR_WIDGET_CONFIG.eventDrop = vm.onDrop;
                }
            }

            // if the event resize was not deactivated or not set
            if (vm.useEventResize !== false || typeof vm.useEventResize === 'undefined') {
                // if the event resize is not provided by the customized config
                if (vm.calendarConfig.hasOwnProperty('eventResize') === false) {
                    // register the default event resize
                    FULL_CALENDAR_WIDGET_CONFIG.eventResize = vm.onResize;
                }
            }

            // if the view render was not deactivated or not set
            if (vm.useViewRender !== false || typeof vm.useViewRender === 'undefined') {
                // if the view render is not provided by the customized config
                if (vm.calendarConfig.hasOwnProperty('viewRender') === false) {
                    // register the default view render
                    FULL_CALENDAR_WIDGET_CONFIG.viewRender = vm.viewRender;
                }
            }

            if (vm.calendarConfig.hasOwnProperty('buttonText') === false) {
                vm.calendarConfig.buttonText = {
                    today: gettextCatalog.getString("Today")
                };
            }

            /**
             * merge possible parent configuration into the default configuration
             */
            if (typeof vm.calendarConfig !== 'undefined') {
                vm.uiConfig.calendar = angular.extend({}, FULL_CALENDAR_WIDGET_CONFIG, vm.calendarConfig);
            } else {
                vm.uiConfig.calendar = FULL_CALENDAR_WIDGET_CONFIG;
            }
        };

        /**
         * handles drag and drop on a calendar element, can be overwritten or deactivated
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
         * handles resize on a calendar element, can be overwritten or deactivated
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
         * uses a provided calendar event service after drag and drop or resize
         * @param changedObject
         */
        vm.updateChanges = function (changedObject) {
            vm.onEventChange(changedObject).then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Meeting updated"));
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to update meeting"));
                    $timeout(vm.updateCalendarSources);
                }
            )
        };

        /**
         * render the tooltip of an calendar element, can be overwritten or deactivated
         * @param event
         * @param element
         * @param view
         */
        vm.eventRender = function (event, element, view) {
            console.error("using inhouse renderer");
            element.attr({
                'calendar-tooltip-widget': '',
                'event': "vm.meetingsDict['" + event.pk + "']"
            });
            $compile(element)($scope);
        };

        /**
         * This callback will get triggered when the user changes the view, or when any of the date navigation methods
         * are called. It can be overwritten.
         */
        vm.viewRender = function (view, element) {
        };
    });
})();
