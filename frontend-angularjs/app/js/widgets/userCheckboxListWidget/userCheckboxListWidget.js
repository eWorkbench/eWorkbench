/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Removes the first occurrence of an element from an array, if it is contained.
     * @param needle
     * @param haystack
     */
    function removeFromArray (needle, haystack) {
        var index = haystack.indexOf(needle);

        if (index >= 0) {
            haystack.splice(index, 1);
        }
    }

    /**
     * Checks if an element is contained in an array.
     * @param needle
     * @param haystack
     */
    function arrayContains (needle, haystack) {
        return haystack.indexOf(needle) >= 0;
    }

    module.directive('userCheckboxListWidget', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/userCheckboxListWidget/userCheckboxListWidget.html',
            controller: 'UserCheckboxListWidgetController',
            scope: {
                // users to render checkboxes for
                users: '=',
                // users with checked checkbox
                selectedUsers: '='
            },
            controllerAs: 'vm',
            bindToController: true
        }
    });

    module.controller('UserCheckboxListWidgetController', function (
        $scope,
        UserNameService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.isUserSelectedMap = [];
            vm.selectedUsers = [];
        };

        vm.removeUser = function (user) {
            removeFromArray(user, vm.users);
            removeFromArray(user, vm.selectedUsers);
            removeFromArray(user.pk, vm.isUserSelectedMap);
        };

        vm.updateSelectionStatus = function (user) {
            var isSelected = vm.isUserSelectedMap[user.pk];

            if (isSelected) {
                if (!arrayContains(user, vm.selectedUsers)) {
                    vm.selectedUsers.push(user);
                }
            } else {
                removeFromArray(user, vm.selectedUsers);
            }
        };

        /**
         * Any the the vm.users collection changes:
         * 1.) Add user display name
         * 2.) Update vm.selectedUsers for new users
         */
        $scope.$watchCollection('vm.users', function (newValue, oldValue) {
            var user = null;

            for (var i = 0; i < vm.users.length; i++) {
                user = vm.users[i];

                // add display name
                user.displayName = UserNameService.getFullNameOrUsername(user);

                // select (check) new users
                if (vm.isUserSelectedMap[user.pk] === undefined) {
                    vm.isUserSelectedMap[user.pk] = true;
                    vm.selectedUsers.push(user);
                }
            }
        });
    });
})();
