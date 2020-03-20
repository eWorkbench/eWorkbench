/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('userManualSidebarWidget', function () {
        return {
            'restrict': 'E',
            'templateUrl': 'js/widgets/userManual/userManualSidebar.html',
            'bindToController': true,
            'controllerAs': 'vm',
            'controller': 'UserManualSidebarWidgetController',
            'scope': {}
        }
    });

    module.controller('UserManualSidebarWidgetController', function (
        $scope,
        $stateParams,
        $transitions,
        AuthRestService,
        UserManualCategoryRestService
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * User Manual Categories
             * @type {Array}
             */
            vm.categories = [];

            /**
             * The primary key of the currently active category
             * @type {null}
             */
            vm.currentActiveCategoryPk = null;

            /**
             * The currently logged in user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            getCategories();
            setCurrentActiveMenuPk($stateParams.userManualCategory);
        };

        var getCategories = function () {
            /**
             * Query the user manual categories
             */
            UserManualCategoryRestService.queryCached().$promise.then(
                function success (response) {
                    vm.categories = response;
                },
                function error (rejection) {
                    console.log(rejection);
                }
            );
        };

        /**
         * Sets the current active category / menu pk
         * @param category
         */
        var setCurrentActiveMenuPk = function (category) {
            vm.currentActiveCategoryPk = category.pk;
        };

        /**
         * Every time a transition finishes, we need to adapt the breadcrumbs for the user manual
         */
        var unregisterTransition = $transitions.onFinish({}, function (trans) {
            var targetState = trans.targetState();

            if (targetState._params.userManualCategory) {
                setCurrentActiveMenuPk(targetState._params.userManualCategory);
            }
        });

        /**
         * When this widget is destroyed, we need to unregister the transition watcher
         */
        $scope.$on("$destroy", function () {
            unregisterTransition();
        });
    });
})();
