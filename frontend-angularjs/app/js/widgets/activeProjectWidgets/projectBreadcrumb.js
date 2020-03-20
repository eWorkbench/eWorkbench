/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('projectBreadcrumbWidget', function () {
        return {
            'restrict': 'E',
            'templateUrl': 'js/widgets/activeProjectWidgets/projectBreadcrumb.html',
            'bindToController': true,
            'controllerAs': 'vm',
            'controller': 'ProjectBreadcrumbWidgetController',
            'scope': {
            }
        }
    });

    module.controller('ProjectBreadcrumbWidgetController', function (
        $scope,
        $injector,
        $q,
        ProjectSidebarService,
        IconImagesService,
        $transitions,
        $state,
        uiRouterHelper
    ) {
        var vm = this;

        vm.breadcrumbs = [];

        vm.project = null;

        var projectSidebarServiceUnsubscribeFunction = ProjectSidebarService.subscribe(function (project) {
            vm.project = project;
        });

        $scope.$on("$destroy", function () {
            projectSidebarServiceUnsubscribeFunction();
        });

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

        /**
         * Leave the current project
         */
        vm.leaveProject = function () {
            ProjectSidebarService.project = null;

            $state.go("project-list");
        };

        $transitions.onFinish({}, function (trans) {
            if (trans._targetState._definition.breadcrumb) {
                // invoke the title function (needs injection pattern)

                var $queryParams = trans._targetState._params;

                $q.all($queryParams).then(function (newQueryParams) {
                    var breadcrumbStates = $injector.invoke(trans._targetState._definition.breadcrumb, null, {
                        '$queryParams': newQueryParams
                    });

                    var breadcrumbs = [];

                    for (var i = 0; i < breadcrumbStates.length; i++) {
                        breadcrumbs.push({
                            'title': uiRouterHelper.getTitleOfState(breadcrumbStates[i]._definition, newQueryParams),
                            'url': $state.href(breadcrumbStates[i].state())
                        });
                    }

                    breadcrumbs.push({
                        'title': uiRouterHelper.getTitleOfState(trans._targetState._definition, newQueryParams)
                    });

                    vm.breadcrumbs = breadcrumbs;

                });


            } else {
                vm.breadcrumbs = [];
            }
        });
    });
})();
