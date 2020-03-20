/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A simple directive which renders a given task state (e.g., NEW or PROG) or priority (HIGH, ...) into an icon
     * with text
     * Uses the taskConverterService
     */
    module.directive('taskStatePriorityDisplayWidget', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/taskStatePriorityDisplay/taskStatePriorityDisplay.html',
            scope: {
                taskState: '=?',
                taskPriority: '=?'
            },
            controller: 'TaskStatePriorityDisplayWidgetController',
            bindToController: true,
            controllerAs: 'vm'
        };
    });

    module.controller('TaskStatePriorityDisplayWidgetController', function (
        $scope,
        TaskConverterService
    ) {
        var vm = this;

        vm.icon = "";
        vm.text = "";

        /**
         * Watch Task State and update the icon and text according to the task state set
         */
        $scope.$watch("vm.taskState", function (newVal) {
            if (newVal) {
                vm.icon = TaskConverterService.taskStateImages[vm.taskState];
                vm.text = TaskConverterService.taskStateTexts[vm.taskState];
            }
        });

        /**
         * Watch Task Priority and update the icon and text according to the task state set
         */
        $scope.$watch("vm.taskPriority", function (newVal) {
            if (newVal) {
                vm.icon = TaskConverterService.taskPriorityImages[vm.taskPriority];
                vm.text = TaskConverterService.taskPriorityTexts[vm.taskPriority];
            }
        });
    });
})();
