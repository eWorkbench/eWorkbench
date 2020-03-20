/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('dashboardDmps', {
        templateUrl: 'js/widgets/dashboardWidgets/dashboardDmps.html',
        controller: 'DashboardDmpsController',
        controllerAs: 'vm',
        bindings: {
            dmps: '<',
            isLoading: '<'
        },
        bindToController: true
    });

    /**
     * Main Controller
     *
     * Displays the mainDashboard overview page
     */
    module.controller('DashboardDmpsController', function (
        DmpStateService,
        IconImagesService,
        dmpCreateModalService
    ) {
        'ngInject';

        var
            vm = this;

        vm.dmpIcon = IconImagesService.mainElementIcons.dmp;
        /**
         * Dictionary with DMP states
         * @type {*}
         */
        vm.dmpStates = DmpStateService.dmpStates;

        vm.createNewDmp = function () {
            var modal = dmpCreateModalService.open();

            modal.result.then(dmpCreateModalService.viewElement);
        };
    });
})();
