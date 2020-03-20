/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    /**
     * A directive which formats a userDisplay object coming from the REST API
     */
    module.directive('labbookLink', function () {
        return {
            templateUrl: 'js/widgets/link/labbookLink.html',
            controller: "LabbookLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                labbook: '='
            }
        }
    });

    module.controller('LabbookLinkController', function (
        $scope,
        $state
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch Labbook and generate an URL for the given labbook
         */
        $scope.$watch("vm.labbook", function () {
            if (vm.labbook) {
                vm.labbookUrl = $state.href("labbook-view", {labbook: vm.labbook});
            } else {
                vm.labbookUrl = "";
            }
        });
    });
})();
