/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name taskStatusDisplayWidget
     *
     * @restrict E
     *
     * @description
     * A directive which formats a task status dictionary
     *
     * @param {object} taskStatus a dictionary containing the number of tasks based on status
     */
    module.directive('taskStatusDisplayWidget', function () {
        return {
            templateUrl: 'js/widgets/taskStatusDisplayWidget/taskStatusDisplayWidget.html',
            controller: 'TaskStatusDisplayWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                taskStatus: '='
            }
        }
    });

    module.controller('TaskStatusDisplayWidgetController', function ($scope, TaskConverterService) {
        'ngInject';

        var vm = this;

        vm.taskConverterService = TaskConverterService;

        /**
         * Total task count (automatically called when vm.taskStatus is updated)
         * @type {number}
         */
        vm.totalCount = 0;

        /**
         * Returns the progress bar based on the task state/type
         * @param taskType
         * @returns {string}
         */
        vm.getProgressbarType = function (taskType) {
            return "progress-bar " + vm.taskConverterService.taskStates[taskType];
        };

        /**
         *  calculate total Count when vm.taskStatus changes
         */
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
