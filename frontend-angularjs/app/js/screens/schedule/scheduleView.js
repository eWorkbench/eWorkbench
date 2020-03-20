/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';


    var module = angular.module('screens');

    module.component('scheduleView', {
        templateUrl: 'js/screens/schedule/scheduleView.html',
        controller: 'ScheduleViewController',
        controllerAs: 'vm'
    });


    module.controller('ScheduleViewController', function () {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * Current View (list or card)
             * @type {string}
             */
            vm.currentView = 'calendar';

            /**
             * calendar configuration of the angular ui calendar
             */
            vm.calendarConfig = {
                header: {
                    left: 'title',
                    center: '',
                    right: 'month agendaWeek today prev next export'
                },
                allDaySlot: false
            };

            vm.users = [];
        };
    });
})();
