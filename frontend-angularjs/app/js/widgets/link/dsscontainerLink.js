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
    module.directive('dsscontainerLink', function () {
        return {
            templateUrl: 'js/widgets/link/dsscontainerLink.html',
            controller: "DSSContainerLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                dsscontainer: '='
            }
        }
    });

    module.controller('DSSContainerLinkController', function (
        $scope,
        $state
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch DSS Container and generate an URL for the given DSS Container
         */
        $scope.$watch("vm.dsscontainer", function () {
            if (vm.dsscontainer) {
                vm.dsscontainerUrl = $state.href("dsscontainer-view", {dsscontainer: vm.dsscontainer});
            } else {
                vm.dsscontainerUrl = "";
            }
        });
    });
})();
