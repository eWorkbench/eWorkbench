/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a task as a card
     */
    module.directive('taskCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/taskCard.html',
            scope: {
                'task': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'TaskCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Task Card Display
     */
    module.controller('TaskCardDisplayController', function (
        IconImagesService,
        taskAssignedUsersModalService
    ) {
        var vm = this;

        /**
         * Task Icon
         * @type {string}
         */
        vm.taskIcon = IconImagesService.mainElementIcons.task;

        /**
         * Project Icon
         * @type {string}
         */
        vm.projectIcon = IconImagesService.mainElementIcons.project;

        /**
         * Displays a modal dialog with a list of assigned users
         * @param task
         */
        vm.showAssignedUsersForTask = function (task) {
            taskAssignedUsersModalService.openModal(task);
        };

    });
})();
