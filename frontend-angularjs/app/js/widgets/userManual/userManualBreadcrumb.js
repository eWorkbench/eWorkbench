/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name userManualBreadcrumbWidget
     *
     * @restrict E
     *
     * @description Displays Breadcrumbs for the User manual
     */
    module.directive('userManualBreadcrumbWidget', function () {
        return {
            'restrict': 'E',
            'templateUrl': 'js/widgets/userManual/userManualBreadcrumb.html',
            'bindToController': true,
            'controllerAs': 'vm',
            'controller': 'UserManualBreadcrumbWidgetController',
            'scope': {
            }
        }
    });

    module.controller('UserManualBreadcrumbWidgetController', function (
        $scope,
        $injector,
        $q,
        $transitions,
        $state,
        $stateParams,
        gettextCatalog,
        uiRouterHelper
    ) {
        var vm = this;

        vm.breadcrumbs = [];

        var getBreadcrumbsAndTitleOfState = function (targetState, queryParams) {
            if (targetState.breadcrumb) {
                // invoke the title function (needs injection pattern)

                if (typeof queryParams === "undefined") {
                    queryParams = $stateParams;
                }

                // wait for all query params to be resolved
                $q.all(queryParams).then(function (newQueryParams) {
                    // get the breadcrumbs for the given targetState via injector
                    var breadcrumbStates = $injector.invoke(targetState.breadcrumb, null, {
                        '$queryParams': newQueryParams
                    });

                    // collect the url and title of all breadcrumbs
                    var breadcrumbs = [];

                    for (var i = 0; i < breadcrumbStates.length; i++) {
                        var actualState = breadcrumbStates[i].state();

                        breadcrumbs.push({
                            'title': uiRouterHelper.getTitleOfState(actualState, newQueryParams),
                            'url': $state.href(actualState)
                        });
                    }

                    breadcrumbs.push({
                        'title': uiRouterHelper.getTitleOfState(targetState, newQueryParams)
                    });

                    vm.breadcrumbs = breadcrumbs;
                });
            } else {
                vm.breadcrumbs = [];
            }
        };

        /**
         * Every time a transition finishes, we need to adapt the breadcrumbs for the user manual
         */
        var unregisterTransition = $transitions.onFinish({}, function (trans) {
            var targetState = trans.targetState();

            getBreadcrumbsAndTitleOfState(targetState.$state(), targetState._params);
        });

        /**
         * When this widget is destroyed, we need to unregister the transition watcher
         */
        $scope.$on("$destroy", function () {
            unregisterTransition();
        });

        /**
         * Handle the initial state (e.g., when this breadcrumb widget is first used)
         */
        getBreadcrumbsAndTitleOfState($state.current);
    });
})();
