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
    module.directive('dmpLink', function () {
        return {
            templateUrl: 'js/widgets/link/dmpLink.html',
            controller: "DmpLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                dmp: '='
            }
        }
    });

    module.controller('DmpLinkController', function (
        $scope,
        $state
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch Dmp and generate an URL for the given dmp
         */
        $scope.$watch("vm.dmp", function () {
            if (vm.dmp) {
                vm.dmpUrl = $state.href("dmp-view", {dmp: vm.dmp});
            } else {
                vm.dmpUrl = "";
            }
        });
    });
})();
