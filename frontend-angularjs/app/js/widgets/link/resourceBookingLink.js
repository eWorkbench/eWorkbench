/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A directive which formats a userDisplay object coming from the REST API
     */
    module.directive('resourceBookingLink', function () {
        'ngInject';

        return {
            templateUrl: 'js/widgets/link/resourceBookingLink.html',
            restrict: 'EA',
            bindToController: true,
            controllerAs: 'vm',
            controller: 'ResourceBookingLinkController',
            scope: {
                resourcebooking: '='
            }
        };
    });

    module.controller('ResourceBookingLinkController', function (
        ResourceBookingCreateEditModalService,
        NavigationService
    ) {
        'ngInject';

        var vm = this;

        vm.openEditModal = function () {
            var modal = ResourceBookingCreateEditModalService.openEdit(vm.resourcebooking);

            modal.result.then(
                function success (response) {
                    NavigationService.reloadPage();
                }
            ).catch(function () {
                console.log("Modal canceled");
            })
        };
    });
})();
