/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('displayRoleWidget', function () {
        return {
            'restrict': 'E',
            'controllerAs': 'vm',
            'bindToController': true,
            'scope': {
                'role': '=?',
                'rolePk': '=?'
            },
            'controller': "DisplayRoleWidgetController",
            'templateUrl': "js/widgets/displayRoleWidget/displayRoleWidget.html"
        }
    });

    module.controller("DisplayRoleWidgetController", function (
        $scope,
        RolesRestService
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * Whether or not the project was found
             * @type {boolean}
             */
            vm.roleNotFound = false;
        };

        $scope.$watch("vm.rolePk", function (newVal, oldVal) {
            if (vm.rolePk) {
                /**
                 * query projects
                 */
                vm.roleNotFound = false;

                RolesRestService.getCached({pk: vm.rolePk}).$promise.then(
                    function success (response) {
                        vm.role = response;
                    },
                    function error (rejection) {
                        vm.roleNotFound = true;
                        vm.role = null;
                    }
                );
            } else if (newVal == null && oldVal !== null) {
                vm.role = null;
            }
        });
    });
})();
