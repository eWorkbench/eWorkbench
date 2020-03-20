/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('maintenance',
        {
            templateUrl: 'js/screens/maintenance/maintenance.html',
            controller: 'MaintenanceController',
            controllerAs: 'vm',
            bindings: {
            }
        }
    );

    /**
     * Maintenance Controller
     * Displays an alert if the admin CMS text with the slug maintenance exists
     */
    module.controller('MaintenanceController', function (
        $http,
        restApiUrl
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.maintenance = null;
            vm.getMaintenanceCmsText();
        };

        vm.getMaintenanceCmsText = function () {
            $http.get(restApiUrl + "cms/maintenance/").then(
                function success (response) {
                    vm.maintenance = response.data;
                },
                function error (rejection) {
                    vm.maintenance = null;
                }
            );
        };
    });
})();
