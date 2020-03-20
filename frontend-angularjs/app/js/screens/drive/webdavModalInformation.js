/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Controller for Webdav Modal Information
     */
    module.controller('WebdavModalInformationController', function (
        $scope,
        drive,
        $uibModalInstance,
        AuthRestService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.drive = drive;

            /**
             * Parses the URL of the drive
             * @param url
             */
            var parseDriveUrl = function (url) {
                var parser = document.createElement('a');

                // set url
                parser.href = url;

                // extract data from <a> tag
                vm.protocol = parser.protocol.replace(':', ''); // => "http"
                vm.hostname = parser.hostname; // => "example.com"
                vm.port = parser.port;     // => "3000"
                vm.path = parser.pathname; // => "/pathname/"
                // parser.search;   // => "?search=test"
                // parser.hash;     // => "#hash"
                // parser.host;     // => "example.com:3000"
            };

            parseDriveUrl(vm.drive.webdav_url);
        };

        // get current user
        AuthRestService.getCurrentUser().$promise.then(
            function success (user) {
                vm.currentUser = user;
            }
        );

        vm.close = function () {
            $uibModalInstance.close();
        };
    });
})();
