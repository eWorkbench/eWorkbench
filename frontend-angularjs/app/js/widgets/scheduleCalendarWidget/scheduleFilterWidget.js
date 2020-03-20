/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    module.component('scheduleFilterWidget', {
        templateUrl: 'js/widgets/scheduleCalendarWidget/scheduleFilterWidget.html',
        controller: 'ScheduleFilterWidgetController',
        controllerAs: 'vm',
        bindings: {
            showTasks: '=?',
            showMeetings: '=?',
            showMyResourceBookings: '=?'
        }
    });

    module.controller('ScheduleFilterWidgetController', function () {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.showTasks = true;
            vm.showMeetings = true;
            vm.showMyResourceBookings = true;
        };

        /**
         * Toggles the showTasks flag
         */
        vm.toggleShowTasks = function () {
            vm.showTasks = !vm.showTasks;
        };

        /**
         * Toggles the showMeetings flag
         */
        vm.toggleShowMeetings = function () {
            vm.showMeetings = !vm.showMeetings;
        };

        /**
         * Toggles the showMyResourceBookings flag
         */
        vm.toggleMyShowResourceBookings = function () {
            vm.showMyResourceBookings = !vm.showMyResourceBookings;
        };
    });
})();
