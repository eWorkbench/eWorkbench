/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * A directive which formats a task status list
     */
    module.directive('taskStatusCompletedWidget', function () {
        return {
            templateUrl: 'js/widgets/taskStatusCompletedWidget/taskStatusCompletedWidget.html',
            controller: 'TaskStatusCompletedWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                taskStatus: '='
            }
        }
    });

    module.controller('TaskStatusCompletedWidgetController', function ($scope, TaskConverterService) {
        'ngInject';

        var vm = this;

        vm.taskTypes = TaskConverterService.taskStates;
        vm.taskTypeOrder = TaskConverterService.taskStateOrder;
        vm.taskTypeText = TaskConverterService.taskStateTexts;

        /**
         * The total task count
         * @type {number}
         */
        vm.totalCount = 0;

        // calculate total task count when vm.taskStatus changes
        $scope.$watch('vm.taskStatus', function () {
            vm.totalCount = vm.getTotalCount();
        }, true);

        /**
         * Calculate the total count of tasks by iterating over vm.tasks
         * Do not call this method directly, as this can result in quite heavy computation
         * @returns {number}
         */
        vm.getTotalCount = function () {
            var cnt = 0;

            // iterate over dictionary
            for (var key in vm.taskStatus) {
                if (vm.taskStatus.hasOwnProperty(key)) {
                    cnt += vm.taskStatus[key];
                }
            }

            return cnt;
        };
    });
})();
