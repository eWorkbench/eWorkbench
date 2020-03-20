/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Service for showing the contact form in a widget.
     */
    module.service('contactFormWidget', function (
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @returns {$uibModalInstance}
         */
        service.open = function () {
            return $uibModal.open({
                templateUrl: 'js/widgets/contactFormWidget/contactFormWidget.html',
                controller: 'ContactFormWidgetController',
                controllerAs: 'vm',
                backdrop: 'static' // do not close modal by clicking outside
            });
        };

        return service;
    });

    module.controller('ContactFormWidgetController', function (
        $uibModalInstance,
        BackendVersionService,
        moment,
        $location,
        ContactFormRestService,
        toaster,
        gettextCatalog,
        $window
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            // get backend version
            BackendVersionService.getBackendVersion().then(function (version) {
                vm.contact_form.backend_version = version;
            });

            vm.contact_form = {
                "subject" : "",
                "message" : "",
                "url" : $location.$$absUrl,
                "browser_version": $window.navigator.userAgent
            };

            /**
             * contains api errors if available
             */
            vm.errors = {};
        };

        vm.send = function () {
            vm.contact_form.local_time = moment().format();

            ContactFormRestService.create(vm.contact_form).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Contact form was sent successfully"));

                    $uibModalInstance.close();
                },
                function error (rejection) {
                    //Request was throttled - too many requests
                    if (rejection.status === 429) {
                        toaster.pop('error',
                            gettextCatalog.getString("Too many requests"),
                            gettextCatalog.getString("You have sent too many requests. Please try it again tomorrow."));
                    } else {
                        toaster.pop('error', gettextCatalog.getString("Failed to sent contact form"));
                        vm.errors = rejection.data;
                    }
                }
            )
        };

        vm.cancel = function () {
            $uibModalInstance.close();
        }
    });
})();
