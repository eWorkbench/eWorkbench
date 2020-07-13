/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Shows the my calendar view.
     */
    module.component('dashboardCalendar', {
        templateUrl: 'js/widgets/dashboardWidgets/dashboardCalendar.html',
        controller: 'DashboardCalendarController',
        controllerAs: 'vm',
        bindings: {
            meetings: '<',
            isLoading: '<',
            selectedUsers: '<'
        },
        bindToController: true
    });

    /**
     * Controller for my calendar overview screen component.
     */
    module.controller('DashboardCalendarController', function (
        $scope,
        $rootScope,
        $state,
        $compile,
        $timeout,
        gettextCatalog,
        toaster,
        IconImagesService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.meetingsIcon = IconImagesService.mainElementIcons.meeting;

            /**
             * calendar configuration of the angular ui calendar
             */
            vm.calendarConfig = {
                header: {
                    left: 'title',
                    center: '',
                    right: 'today prev next' //set buttons
                },
                slotDuration: '02:00:00'
            };

            vm.selectedUsers = [];
        };
    });
})();
