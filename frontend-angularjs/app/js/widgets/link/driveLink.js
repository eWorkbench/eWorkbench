/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    /**
     * A directive which formats a 'drive' object coming from the REST API
     */
    module.directive('driveLink', function () {
        return {
            templateUrl: 'js/widgets/link/driveLink.html',
            controller: "DriveLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                drive: '='
            }
        }
    });

    module.controller('DriveLinkController', function (
        $scope,
        $state
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch Drive and generate an URL for the given drive
         */
        $scope.$watch("vm.drive", function () {
            if (vm.drive) {
                vm.driveUrl = $state.href("drive-view", {drive: vm.drive});
            } else {
                vm.driveUrl = "";
            }
        });
    });
})();
