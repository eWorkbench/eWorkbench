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
    module.directive('plugininstanceLink', function () {
        return {
            templateUrl: 'js/widgets/link/plugininstanceLink.html',
            controller: "PlugininstanceLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                plugininstance: '='
            }
        }
    });

    module.controller('PlugininstanceLinkController', function (
        $scope,
        $state
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch Plugin Instance and generate an URL for the given plugin instance
         */
        $scope.$watch("vm.plugininstance", function () {
            if (vm.plugininstance) {
                vm.plugininstanceUrl = $state.href("plugininstance-view", {plugininstance: vm.plugininstance});
            } else {
                vm.plugininstanceUrl = "";
            }
        });
    });
})();
