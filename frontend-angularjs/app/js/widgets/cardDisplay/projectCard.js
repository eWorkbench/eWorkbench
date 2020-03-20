/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a project as a card
     */
    module.directive('projectCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/projectCard.html',
            scope: {
                'project': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'ProjectCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Project Card Display
     */
    module.controller('ProjectCardDisplayController', function (IconImagesService, gettextCatalog) {
        var vm = this;

        /**
         * Project Icon
         * @type {string}
         */
        vm.projectIcon = IconImagesService.mainElementIcons.project;

        /**
         * Project Icon
         * @type {string}
         */
        vm.projectIcon = IconImagesService.mainElementIcons.project;
        /**
         * Remaining Column definitions
         * @type {Array}
         */
        vm.columnDefs = [
            // display task status (progress)
            {
                field: 'tasks_status',
                displayName: gettextCatalog.getString("Progress"),
                cellTemplate: '<task-status-display-widget task-status="row.branch.tasks_status">' +
                '</task-status-display-widget>'
            },
            {
                displayName: '',
                sortable: false,
                cellTemplate: '<generic-delete-menu-widget model-object="row.branch">' +
                '</generic-delete-menu-widget>'

            }
        ];

        vm.treeAPI = {};

        /**
         * First Column is the Expanding property: Project name
         * @type {{}}
         */
        vm.treeGridExpandingProperty = {
            field: 'name',
            cellTemplate: '<project-link project="row.branch" edit="false">' +
            '</project-link>'
        };
    });
})();
