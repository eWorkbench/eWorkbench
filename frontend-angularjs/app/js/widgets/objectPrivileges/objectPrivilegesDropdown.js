/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('objectPrivilegesDropdownWidget', function () {
        return {
            restrict: 'E',
            controllerAs: 'vm',
            bindToController: true,
            templateUrl: 'js/widgets/objectPrivileges/objectPrivilegesDropdown.html',
            controller: 'ObjectPrivilegesDropdownWidgetController',
            scope: {
                'ngModel': '=',
                'iconClass': '@',
                'toggleDisabled': '=?',
                'ngDisabled': '=?',
                'ngChange': '&',
                'tooltip': '@',
                'useNeutralPrivilege': '=?'
            }
        };
    });

    module.controller('ObjectPrivilegesDropdownWidgetController', function (
        $scope,
        $timeout
    ) {
        "ngInject";

        var vm = this;

        var possiblePrivileges = ["AL"];

        if (vm.useNeutralPrivilege) {
            possiblePrivileges.push("NE"); // neutral
        } else {
            possiblePrivileges.push("DE"); // deny
        }

        vm.changeTo = function (newPrivilege) {
            vm.ngModel = newPrivilege;

            $timeout(vm.ngChange);
        };

        vm.togglePrivilege = function () {
            if (!vm.toggleDisabled) {
                if (vm.ngModel == possiblePrivileges[0]) {
                    vm.changeTo(possiblePrivileges[1]);
                } else {
                    vm.changeTo(possiblePrivileges[0]);
                }
            }
        };
    });
})();
