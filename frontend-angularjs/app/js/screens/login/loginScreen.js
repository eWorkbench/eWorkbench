/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');


    module.component('loginScreen', {
        templateUrl: 'js/screens/login/loginScreen.html',
        controller: 'LoginScreenController',
        bindings: {}
    });

    /**
     * Login Controller
     *
     * Displays a login form
     */
    module.controller('LoginScreenController', function (
        $scope,
        $rootScope,
        $location,
        $timeout,
        $stateParams,
        $state,
        SitePreferences,
        AuthLocalStorageService,
        AuthRestService,
        toaster,
        gettextCatalog,
        IconImagesService,
        $window
    ) {
        'ngInject';

        $scope.preferences = SitePreferences.preferences;

        /**
         * get the correct icons
         */
        $scope.userIcon = IconImagesService.mainElementIcons.user;
        $scope.passwordIcon = IconImagesService.genericIcons.password;
        $scope.alertIcon = IconImagesService.mainWarningIcons.alert;

        $scope.cmsContent = '';

        $scope.closeCmsContent = function () {
            $scope.cmsContent = '';
        };

        $scope.openCmsContent = function (slug) {
            $scope.cmsContent = slug;
        };

        $scope.$watch(function () {
            return $stateParams.password_reset_token;
        }, function () {
            if ($stateParams.password_reset_token !== undefined && $stateParams.password_reset_token != '') {
                $scope.resetUserObject();
                $scope.user.showResetPassword = true;
                $scope.user.resetToken = $stateParams.password_reset_token;
            } else {
                delete $scope.user.resetToken;
            }
        });

        /**
         * store the Auth Factory locally
         * @type {any}
         */
        $scope.Auth = AuthRestService;

        /**
         * username and password used in input field for login form
         */
        $scope.user = {};

        /**
         * Whether or not the user wants to stay logged in for a certain time
         * @type {boolean}
         */
        $scope.rememberMe = false;

        /**
         * Error message from REST API
         * @type {string}
         */
        $scope.error = "";

        $scope.fieldErrors = {};

        var originalUrl = $location.url();

        if (originalUrl == "") {
            originalUrl = "/";
        }

        /**
         * Method for setting the user object to default values
         */
        $scope.resetUserObject = function () {
            $scope.user = {'username': '', 'password': '', 'email': '', 'showResetPassword': false };
        };

        /**
         * Set the user object to default values
         */
        $scope.resetUserObject();

        /**
         * Switch to Login View
         */
        $scope.goToLoginView = function () {
            $scope.error = "";
            $scope.fieldErrors = {};
            $scope.resetUserObject();
            $state.go('main');
        };

        /**
         * Switch to Password Reset View
         */
        $scope.goToPasswordResetView = function () {
            $scope.error = "";
            $scope.fieldErrors = {};
            $scope.resetUserObject();
            $scope.user.showResetPassword = true;
        };

        $scope.tryResetPassword = function () {
            $scope.errors = {};
            console.log('Trying to reset password');

            $scope.user.passwordResetSuccess = false;

            AuthRestService.tryResetPassword($scope.user.email).then(
                function success (response) {
                    $scope.user.passwordResetSuccess = true;
                    toaster.pop('success', gettextCatalog.getString("Password reset successful"));
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to reset password"));
                    if (rejection.data) {
                        $scope.fieldErrors = rejection.data;
                    }
                    $scope.user.passwordResetSuccess = false;
                }
            )
        };

        /**
         * Change the password with a valid reset token
         */
        $scope.tryChangePassword = function () {
            $scope.user.passwordResetSuccess = false;

            // check if passwords match
            if ($scope.user.password != $scope.user.password_confirm) {
                toaster.pop('error', gettextCatalog.getString("Passwords do not match"));

                return;
            }

            AuthRestService.tryRealResetPassword($scope.user.password, $scope.user.resetToken).then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Password changed"));
                    $scope.user.passwordResetSuccess = true;
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to reset password"));
                    if (rejection.data) {
                        $scope.fieldErrors = rejection.data;
                    }
                    $scope.user.passwordResetSuccess = false;
                }
            )
        };

        /**
         * OnSubmit of login form --> try to login
         * Send username and password to the auth endpoint
         */
        $scope.tryLogin = function () {
            $scope.error = "";
            $scope.fieldErrors = {};

            console.log('Trying to login');

            // Query services endpoint for login
            AuthRestService.login({'username': $scope.user.username, 'password': $scope.user.password}).then(
                function success (response) {
                    // positive result
                    console.log(response);
                    toaster.pop('success', gettextCatalog.getString('Logged in as ') + response.username + '!');

                    $state.go('main').then(function () {
                        if (originalUrl) {
                            console.log("Redirecting to " + originalUrl);

                            $timeout(function () {
                                $location.path(originalUrl);
                            });
                        }
                    });
                },
                function error (rejection) {
                    // negative result
                    console.log(rejection);

                    if (rejection.status == -1) {
                        toaster.pop('error',
                            gettextCatalog.getString("Failed to login"),
                            gettextCatalog.getString('Server not available')
                        );
                    } else  if (rejection.data && rejection.data.non_field_errors) {
                        $scope.error = rejection.data.non_field_errors.join(', ');
                        toaster.pop('error',
                            gettextCatalog.getString("Failed to login"),
                            rejection.data.non_field_errors.join(', ')
                        );
                    } else if (rejection.data) {
                        $scope.fieldErrors = rejection.data;

                        $scope.error = gettextCatalog.getString("Failed to login. Please correct the errors below!");
                        toaster.pop('error', gettextCatalog.getString("Failed to login"));
                    } else {
                        // unknown error
                        $scope.error = gettextCatalog.getString("Unknown error");
                        toaster.pop('error',
                            gettextCatalog.getString("Failed to login"),
                            gettextCatalog.getString("Unknown error")
                        );
                    }
                }
            );
        };

        /**
         * check if there is an auth token
         */
        if (AuthLocalStorageService.hasToken()) {
            // user has an auth token, try to login with it
            AuthRestService.tryLoginWithAuthToken().then(
                function (response) {
                    // positive result (already handled by tryLoginWithAUthToken)
                    console.log(response);
                },
                function (rejection) {
                    console.log('Failed to login with token...');
                    console.log(rejection);

                    if (rejection.status == -1) {
                        // this usually means that the server is not available
                        toaster.pop('error',
                            gettextCatalog.getString("Failed to login"),
                            gettextCatalog.getString('Server not available')
                        );

                        // auto refresh in 30 seconds
                        setTimeout(function () {
                            window.location.reload(true);
                        }, 30 * 1000);
                    }
                }
            );
        }
    });
})();
