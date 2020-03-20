/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.component('ossLicensesView', {
        templateUrl: 'js/screens/cms/ossLicensesView.html',
        controller: 'OSSLicensesViewController',
        controllerAs: 'vm',
        bindings: {
        }
    });

    module.controller('OSSLicensesViewController', function (
        $scope,
        $http,
        restApiUrl
    ) {
        "ngInject";

        var vm = this;

        vm.licensesFrontend = [];

        vm.licensesBackend = [];

        /**
         * default sort column
         */
        vm.sortColumnBackend = "key";

        /**
         * Default Sort order
         * @type {boolean}
         */
        vm.sortReverseBackend = false;

        /**
         * default sort column
         */
        vm.sortColumnFrontend = "key";

        /**
         * Default Sort order
         * @type {boolean}
         */
        vm.sortReverseFrontend = false;

        $http.get("osslicenses_frontend.json").then(
            function (response) {
                vm.licensesFrontend = response.data;
            }
        );

        $http.get(restApiUrl + "oss_licenses").then(
            function (response) {
                vm.licensesBackend = response.data;
            }
        );
    });
})();
