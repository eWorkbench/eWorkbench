/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Shows the calendar view.
     */
    module.component('overviewCalendar', {
        templateUrl: 'js/screens/project/overviewCalendar.html',
        controller: 'OverviewCalendarController',
        controllerAs: 'vm',
        bindings: {
            'project': '='
        }
    });

    /**
     * Controller for calendar overview screen component.
     */
    module.controller('OverviewCalendarController', function (
        $scope
    ) {
        'ngInject';

        var
            vm = this;

        vm.collectedProjectPks = [];

        $scope.$watch("vm.project", function () {
            vm.collectedProjectPks = [vm.project.pk];

            // iterate over all sub projects
            for (var i = 0; i < vm.project.project_tree.length; i++) {
                vm.collectedProjectPks.push(vm.project.project_tree[i].pk);
            }
        });

        this.$onInit = function () {
            /**
             * config of the ui calendar
             */
            vm.calendarConfig = {
                header: { //set the header of the ui calendar
                    left: 'schedule',
                    center: 'title',
                    right: 'month agendaWeek today prev next export'
                },
                allDaySlot: true
            };
        };

    });
})();
