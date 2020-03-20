/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    module.directive('taskAssignedUsersCellWidget', function () {
        return {
            templateUrl: 'js/widgets/taskAssignedUsersCellWidget/taskAssignedUsersCellWidget.html',
            controller: 'TaskAssignedUsersCellWidget',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                task: '='
            }
        }
    });

    /**
     * Controller for directive taskAssignedUsersCellWidget
     */
    module.controller('TaskAssignedUsersCellWidget', function (
        $uibModal,
        taskAssignedUsersModalService
    ) {
        'ngInject';

        var vm = this;

        /**
         * Displays a modal dialog with a list of assigned users
         * @param task
         */
        vm.showAssignedUsersForTask = function (task) {
            taskAssignedUsersModalService.openModal(task);
        };
    });
})();
