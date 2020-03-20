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
    module.directive('resourceLink', function () {
        return {
            templateUrl: 'js/widgets/link/resourceLink.html',
            controller: "ResourceLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                resource: '='
            }
        }
    });

    module.controller('ResourceLinkController', function (
        $scope,
        $state
    ) {
        'ngInject';

        var vm = this;

        /**
         * Watch Task and generate an URL for the given resource
         */
        $scope.$watch("vm.resource", function () {
            if (vm.resource) {
                vm.resourceUrl = $state.href("resource-view", {resource: vm.resource});
            } else {
                vm.resourceUrl = "";
            }
        });
    });
})();
