/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('screens');

    module.component('userProfilePassword', {
        templateUrl: 'js/screens/userProfile/userProfilePassword.html',
        controller: 'UserProfilePasswordController',
        controllerAs: 'vm'
    });

    module.controller('UserProfilePasswordController', function (
        $scope,
        $state,
        MyUser,
        gettextCatalog,
        toaster
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * New Password
             */
            vm.password = '';

            /**
             * Confirm new password
             * @type {string}
             */
            vm.password_confirm = '';

            /**
             * whether or not the password has been changed
             * @type {boolean}
             */
            vm.passwordChanged = false;
        };

        /**
         * change the password of the user
         */
        vm.changePassword = function () {
            // check if passwords match
            if (vm.password != vm.password_confirm || vm.password == "") {
                toaster.pop('error', gettextCatalog.getString("Passwords do not match"));

                return;
            }

            vm.errors = {};

            var newPassword = {
                'password': vm.password
            };

            MyUser.changePassword(newPassword).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Password changed"));

                    // reset password
                    vm.password = vm.password_confirm = "";

                    vm.passwordChanged = true;
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to change password"));
                    vm.errors = rejection.data;
                }
            );
        };

        /**
         * Cancel user password changes
         * Cancels all changes by reloading the element from the REST API
         */
        vm.cancelPasswordChanges = function () {
            $state.go('preferences');
        };

    });
})();
