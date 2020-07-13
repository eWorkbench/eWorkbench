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
            showMyTasks: '=?',
            showMyMeetings: '=?'
        }
    });

    module.controller('ScheduleFilterWidgetController', function () {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.showMyTasks = true;
            vm.showMyMeetings = true;
        };

        /**
         * Toggles the showMyTasks flag
         */
        vm.toggleShowMyTasks = function () {
            vm.showMyTasks = !vm.showMyTasks;
        };

        /**
         * Toggles the showMyMeetings flag
         */
        vm.toggleShowMyMeetings = function () {
            vm.showMyMeetings = !vm.showMyMeetings;
        };
    });
})();
