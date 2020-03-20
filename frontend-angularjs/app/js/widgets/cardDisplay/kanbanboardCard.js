/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a kanbanboard as a card
     */
    module.directive('kanbanboardCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/kanbanboardCard.html',
            scope: {
                'kanbanboard': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'KanbanBoardCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for KanbanBoard Card Display
     */
    module.controller('KanbanBoardCardDisplayController', function (
        IconImagesService,
        TaskConverterService
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * KanbanBoard Icon
             * @type {string}
             */
            vm.kanbanboardIcon = IconImagesService.mainElementIcons.kanbanboard;

            /**
             * Project Icon
             * @type {string}
             */
            vm.projectIcon = IconImagesService.mainElementIcons.project;

            /**
             * Task states
             * @type {Array|taskStates|{NEW, PROG, DONE}}
             */
            vm.taskStateImages = TaskConverterService.taskStateImages;

            // prevent a 404 if there is no thumbnail
            if (!vm.kanbanboard.background_image_thumbnail) {
                vm.style = {
                    'background-image': '',
                    'background-color': vm.kanbanboard.background_color
                };
            } else  {
                vm.style = {
                    'background-image': 'url("' + vm.kanbanboard.background_image_thumbnail + '")',
                    'background-color': vm.kanbanboard.background_color
                };
            }


        }

    });
})();
