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
    module.directive('taskLink', function () {
        return {
            templateUrl: 'js/widgets/link/taskLink.html',
            controller: "TaskLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                task: '='
            }
        }
    });

    module.controller('TaskLinkController', function (
        $scope,
        $state
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch Task and generate an URL for the given task
         */
        $scope.$watch("vm.task", function () {
            if (vm.task) {
                vm.taskUrl = $state.href("task-view", {task: vm.task});
            } else {
                vm.taskUrl = "";
            }
        });
    });
})();
