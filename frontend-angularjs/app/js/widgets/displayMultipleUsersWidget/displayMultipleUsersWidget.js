/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('displayMultipleUsersWidget', function () {
        return {
            'controller':  "DisplayMultipleUsersWidgetController",
            'templateUrl': "js/widgets/displayMultipleUsersWidget/displayMultipleUsersWidget.html",
            'controllerAs': 'vm',
            'bindToController': true,
            'scope': {
                'users': '=',
                'maxUsers': '=?' // default: 3
            }
        };
    });

    module.controller('DisplayMultipleUsersWidgetController', function (
        $scope,
        $timeout,
        $uibModal
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * If max users is not set, set it to the default: 3
             */
            if (!vm.maxUsers) {
                vm.maxUsers = 5;
            }

            vm.expanded = false;

            vm.userLimit = vm.maxUsers;
        };

        vm.openUserModal = function (user) {
            var modalInstance = $uibModal.open({
                templateUrl: 'js/widgets/userDisplayDetailWidget/userDisplayDetailWidget.html',
                controller: 'userDisplayDetailWidgetController',
                controllerAs: 'vm',
                resolve: {
                    user: function () {
                        return user;
                    }
                }
            });

            modalInstance.result.then(
                function () {
                    console.log('modal dialog closed');
                }
            );
        };
    });
})();
