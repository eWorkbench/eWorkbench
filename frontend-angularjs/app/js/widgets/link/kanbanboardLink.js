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
    module.directive('kanbanboardLink', function () {
        return {
            templateUrl: 'js/widgets/link/kanbanboardLink.html',
            controller: "KanbanboardLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                kanbanboard: '='
            }
        }
    });

    module.controller('KanbanboardLinkController', function (
        $scope,
        $state
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch kanbanboard and generate an URL for the given kanbanboard
         */
        $scope.$watch("vm.kanbanboard", function () {
            if (vm.kanbanboard) {
                vm.kanbanboardUrl = $state.href("kanbanboard-view", {kanbanboard: vm.kanbanboard});
            } else {
                vm.kanbanboardUrl = "";
            }
        });
    });
})();
