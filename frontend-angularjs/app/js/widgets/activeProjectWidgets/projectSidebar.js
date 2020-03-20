/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('projectSidebarWidget', function () {
        return {
            'restrict': 'E',
            'templateUrl': 'js/widgets/activeProjectWidgets/projectSidebar.html',
            'bindToController': true,
            'controllerAs': 'vm',
            'controller': 'ProjectSidebarWidgetController',
            'scope': {
            }
        }
    });

    /**
     * Register a run method for this widget
     */
    module.run(function (
        $rootScope,
        ProjectSidebarService
    ) {
        "ngInject";

        ProjectSidebarService.subscribe(function (project) {
            if (project) {
                $rootScope.projectSidebarExpanded = 'sidebar-expanded';
            } else {
                $rootScope.projectSidebarExpanded = 'sidebar-collapsed';
            }
        });
        $rootScope.projectSidebarExpanded = 'sidebar-collapsed';
    });

    module.controller('ProjectSidebarWidgetController', function (
        $scope,
        AuthRestService,
        ProjectSidebarService,
        IconImagesService,
        $transitions
    ) {
        var vm = this;

        var projectSidebarServiceUnsubscribeFunction = undefined;

        this.$onInit = function () {
            projectSidebarServiceUnsubscribeFunction = ProjectSidebarService.subscribe(function (project) {
                vm.project = project;
                if (project) {
                    vm.expanded = 'sidebar-expanded';
                } else {
                    vm.expanded = 'sidebar-collapsed';
                }
            });
            vm.expanded = 'sidebar-collapsed';

            vm.historyIcon = IconImagesService.genericIcons.history;

            vm.mainElementIcons = IconImagesService.mainElementIcons;
            vm.mainActionIcons = IconImagesService.mainActionIcons;
            /**
             * The currently logged in user
             * @type {undefined}
             */
            vm.currentUser = AuthRestService.getCurrentUser();
        };

        vm.closeSidebar = function () {
            ProjectSidebarService.project = null;
        };

        /**
         * On any transition, update currentActivePage so we can highlight the active page in the sidebar
         */
        $transitions.onSuccess({}, function (trans) {
            var menuItem = trans.$to().activeMenuItem;

            if (menuItem) {
                vm.currentActivePage = menuItem;
            } else {
                vm.currentActivePage = "";
            }
        });

        $scope.$on("$destroy", function () {
            projectSidebarServiceUnsubscribeFunction();
        });
    });
})();
