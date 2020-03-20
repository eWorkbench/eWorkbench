/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    module.component('resourceBookingEditView', {
        controller: 'ResourceBookingEditViewController',
        controllerAs: 'vm'
    });

    module.controller('ResourceBookingEditViewController', function (
        $stateParams,
        $state,
        MyResourceBookingsRestService,
        toaster,
        gettextCatalog,
        ResourceBookingCreateEditModalService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.resourcebookingPk = $stateParams.resourcebookingPk;
            vm.openEditModal();
        };

        /**
         * Get ResourceBooking from the REST API
         */
        vm.openEditModal = function () {
            return MyResourceBookingsRestService.get({pk: vm.resourcebookingPk}).$promise.then(
                function success (response) {
                    vm.resourcebooking = response;

                    // create a modal and wait for a result
                    var modal = ResourceBookingCreateEditModalService.openEdit(vm.resourcebooking);

                    // after the modal is dismissed the calendar is reloaded to show changes
                    modal.result.then(function () {
                        modal.close(false);
                        $state.go('schedule', {}, {reload: true});
                    }).catch(function () {
                        console.log("Modal canceled");
                    });
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not get resourcebooking"));
                }
            );
        };
    });
})();
