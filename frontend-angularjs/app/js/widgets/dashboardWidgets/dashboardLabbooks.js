/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('dashboardLabbooks', {
        templateUrl: 'js/widgets/dashboardWidgets/dashboardLabbooks.html',
        controller: 'DashboardLabbooksController',
        controllerAs: 'vm',
        bindings: {
            labbooks: '<',
            isLoading: '<'
        },
        bindToController: true
    });

    /**
     * Main Controller
     *
     * Displays the mainDashboard overview page
     */
    module.controller('DashboardLabbooksController', function (
        IconImagesService,
        labbookCreateModalService
    ) {
        'ngInject';

        var
            vm = this;

        vm.labbookIcon = IconImagesService.mainElementIcons.labbook;

        vm.createNewLabbook = function () {
            var modal = labbookCreateModalService.open();

            modal.result.then(labbookCreateModalService.viewElement);
        };
    });
})();
