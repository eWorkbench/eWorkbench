/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    module.directive('meetingReminderWidget', function () {
        return {
            templateUrl: 'js/widgets/meetingReminder/meetingReminderWidget.html',
            controller: 'MeetingReminderWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                meeting: '<',
                template: '<',
                errors: '<',
                readOnly: '<'
            }
        }
    });

    module.controller('MeetingReminderWidgetController', function (
        $scope,
        $timeout,
        gettextCatalog
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.timeUnitOptions = [
                {value: 'MINUTE', text: gettextCatalog.getString('minutes')},
                {value: 'HOUR', text: gettextCatalog.getString('hours')},
                {value: 'DAY', text: gettextCatalog.getString('days')},
                {value: 'WEEK', text: gettextCatalog.getString('weeks')}
            ];

            vm.default = {
                timedelta_unit: 'MINUTE',
                timedelta_value: 15,
                active: false
            };

            vm.updateWatchValue();
        };

        /**
         * Sets default values for vm.meeting.scheduled_notification_writable
         * When reading from the backend, vm.meeting.scheduled_notification is filled in (If it exists)
         * To write/save, we need to submit vm.meeting.scheduled_notification_writable, as this is used in the
         * backend's nested serializer
         * For convenience, vm.meeting.scheduled_notification_writable is also used in all templates.
         */
        vm.initializeReminder = function () {
            var settings = vm.default;

            if (vm.template && vm.template.scheduled_notification) {
                settings = vm.template.scheduled_notification;
            } else if (vm.meeting && vm.meeting.scheduled_notification) {
                settings = vm.meeting.scheduled_notification;
            }

            vm.meeting.scheduled_notification_writable = angular.copy(settings);
        };

        /**
         * Update vm.watchValue if any attribute of the meeting changes.
         */
        $scope.$watch('vm.meeting', function () {
            vm.updateWatchValue();
        }, true);

        /**
         * Re-initialize the reminder if any attribute of the meeting changes (except the reminder itself).
         */
        $scope.$watch('vm.watchValue', function () {
            vm.initializeReminder();
        }, true);

        /**
         * Updates vm.watchValue with the current meeting data, but filters the reminder out.
         */
        vm.updateWatchValue = function () {
            var val = angular.copy(vm.meeting);

            delete val.scheduled_notification_writable;

            vm.watchValue = val;
        };
    });
})();
