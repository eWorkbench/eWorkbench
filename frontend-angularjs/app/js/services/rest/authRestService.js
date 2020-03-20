/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /** Login - login with your credentials, return an auth token */
    module.factory('Auth',
        function ($resource, restApiUrl) {
            'ngInject';

            return $resource(restApiUrl + 'auth/login/', {}, {
                'login': {
                    'method': 'POST'
                },
                'resetPassword': {
                    'method': 'POST',
                    'url': restApiUrl + 'auth/reset_password/'
                },
                'confirmResetPassword': {
                    'method': 'POST',
                    'url': restApiUrl + 'auth/reset_password/confirm/'
                }
            });
        }
    );


    /** Logout - should delete the auth token on server side */
    module.factory('Logout',
        function ($resource, restApiUrl) {
            'ngInject';

            return $resource(restApiUrl + 'auth/logout/', {}, {
                'logout': {
                    'method': 'POST'
                }
            });
        }
    );

    /** Get the current user */
    module.factory('MyUser',
        function ($resource, restApiUrl) {
            'ngInject';

            return $resource(restApiUrl + 'me/', {}, {
                'changePassword': {
                    method: 'PUT',
                    'url': restApiUrl + 'me/change_password/',
                    'isArray': true
                }
            });
        }
    );

    /** uploads the new avatar image */
    module.factory('UploadAvatarImage',
        function (restApiUrl, Upload) {
            'ngInject';

            return {
                'upload' : function (file) {
                    return Upload.upload({
                        method: 'PUT',
                        url: restApiUrl + 'me/update_avatar/',
                        data: {
                            avatar: file
                        }
                    })
                }
            }
        }
    );

    /**
     * @ngdoc service
     *
     * @name AuthLocalStorageService     *
     *
     * @memberOf module:services
     *
     * @description
     * Service which wraps local storage for the auth token
     */
    module.service('AuthLocalStorageService', function (StorageService) {
        "nginject";

        var service = {};

        /**
         * Stores the token in StorageService.authentication_token
         * @param newToken the new token that needs to be saved in local storage
         */
        service.setToken = function (newToken) {
            StorageService.authentication_token = newToken;
        };

        /**
         * Checks if a token exists in local storage, and returns it if it exists
         * If none exists, "undefined" is returned
         * @returns {*}
         */
        service.getToken = function () {
            return StorageService.authentication_token;
        };

        /**
         * Checks whether or not there is an auth token in local storage
         * @returns {*|boolean}
         */
        service.hasToken = function () {
            var token = StorageService.authentication_token;

            return (token !== undefined && token !== null && token != '');
        };

        /**
         * Resets the token in local storage
         */
        service.resetToken = function () {
            StorageService.authentication_token = null;
        };

        return service;
    });

    /**
     * @ngdoc factory
     *
     * @name AuthRestService
     *
     * @memberOf module:services
     *
     * @requires $http
     * @requires $q
     * @requires $resource
     *
     * @description
     * AuthRestService provides several functions and tools for authentication of users
     */
    module.factory('AuthRestService', function (
        $http,
        $q,
        $resource,
        $rootScope,
        $state,
        $timeout,
        $window,
        Auth,
        AuthLocalStorageService,
        Logout,
        MyUser,
        StorageService
    ) {
        'ngInject';

        console.log('Initializing Rest Auth Factory');

        var obj = {};

        /**
         * Defines whether or not the user is currently logged in
         * @type {boolean}
         */
        obj.isLoggedIn = false;

        /**
         * The currently logged in user
         * @type {{}}
         */
        obj.currentUser = undefined;

        /**
         * Defines whether or not a login is currently in progress
         * @type {boolean}
         */
        obj.loginInProgress = false;


        /**
         * Defines whether or not a login with an existing token is currently in progress
         * @type {boolean}
         */
        obj.loginInProgressWithExistingToken = false;

        /**
         * A promise that fires when a successful login happened
         * @type {promise}
         */
        obj.waitForLoginPromise = $q.defer();

        /**
         * Returns the promise waitForLoginPromise, which fires when a successful login happens
         * @returns {*}
         */
        obj.getWaitForLoginPromise = function () {
            return obj.waitForLoginPromise.promise;
        };

        /**
         * Resets the wait for login promise
         */
        obj.resetLoginPromise = function () {
            obj.waitForLoginPromise = $q.defer();
        };

        /**
         * Try to reset the password with a valid token
         */
        obj.tryRealResetPassword = function (new_password, token) {
            return Auth.confirmResetPassword({password: new_password, token: token}).$promise;
        };

        /**
         * Try to get a token for reseting the password
         */
        obj.tryResetPassword = function (email) {
            return Auth.resetPassword({email: email}).$promise;
        };

        /**
         * Login using credentials
         * @param credentials
         * @returns {Promise}
         */
        obj.login = function (credentials) {
            var deferred = $q.defer();

            obj.loginInProgress = true;

            console.log('Auth:login with credentials');
            // first, make sure that local storage is reset
            AuthLocalStorageService.resetToken();
            // second, make sure that the auth token is not set at all
            delete $http.defaults.headers.common.Authorization;

            Auth.login(credentials).$promise.then(
                function (response) {
                    console.log('Auth:login successful, received token');

                    // write token in local storage
                    console.log('Writing auth token to StorageService');

                    AuthLocalStorageService.setToken(response.token);

                    // also get current user
                    obj.currentUser = MyUser.get();

                    // check promise and resolve it
                    obj.currentUser.$promise.then(
                        function (userResponse) {
                            obj.loginInProgress = false;
                            obj.isLoggedIn = true;

                            var curUser = userResponse;

                            curUser.token = response.token;
                            deferred.resolve(curUser);
                            console.log("Resolving waitForLoginPromise!");
                            obj.waitForLoginPromise.resolve(curUser);
                        },
                        function (rejection) {
                            obj.resetCurrentUserAndLogout();
                            console.log('Failed to query current user');
                            console.log(rejection);
                            deferred.reject(rejection);
                        }
                    );
                },
                function (rejection) {
                    obj.resetCurrentUserAndLogout();

                    console.log('Auth:login failed');

                    console.log(rejection);

                    // resolve promise
                    deferred.reject(rejection);
                }
            );

            // return the promise
            return deferred.promise;
        };


        /**
         * Reset current user and is logged in flag
         */
        obj.resetCurrentUserAndLogout = function () {
            obj.loginInProgress = false;
            obj.isLoggedIn = false;
            obj.currentUser = undefined;

            // make sure that local storage is reset
            AuthLocalStorageService.resetToken();
        };

        /**
         * Log out the current user
         * @returns {promise}
         */
        obj.logout = function () {
            console.log('Authentication:logout');
            // call the webservice logout
            var logout = Logout.logout();

            // reset login promise
            obj.resetLoginPromise();

            logout.$promise.then(
                function success (response) {
                    obj.resetCurrentUserAndLogout();

                    // reset local storage completely
                    StorageService.$reset();
                }
            );

            return logout.$promise;
        };

        /**
         * Gets the current user
         * @returns {*|undefined|{}}
         */
        obj.getCurrentUser = function () {
            return obj.currentUser;
        };

        obj.tryLoginWithAuthToken = function () {
            var deferred = $q.defer();

            obj.loginInProgressWithExistingToken = true;

            console.log('Authentication:Logging in with token');


            // see if the token is already set
            var token = AuthLocalStorageService.getToken();

            if (token && token != '') {
                // token found, try logging in by getting the current user
                obj.loginInProgress = true;
                obj.currentUser = MyUser.get();
                obj.currentUser.$promise.then(
                    function (userResponse) {
                        obj.loginInProgress = false;
                        obj.loginInProgressWithExistingToken = false;

                        console.log('Login via Token successful');
                        obj.isLoggedIn = true;

                        var curUser = userResponse;

                        curUser.token = token;
                        deferred.resolve(curUser);
                        console.log("Resolving waitForLoginPromise (tryLoginWithAuthToken)");
                        obj.waitForLoginPromise.resolve(curUser);
                    },
                    function (rejection) {
                        if (rejection.status != -1) {
                            // did not work --> need to ask user to login
                            console.log('Error calling getUser() - asking user to login');

                            obj.resetCurrentUserAndLogout();
                        } else {
                            console.log("Server down...");
                        }

                        deferred.reject(rejection);
                    }
                );
            } else {
                console.log("no token found");
            }

            return deferred.promise;
        };

        /**
         * Handle broadcasts for sessionExpired
         * resets the current user and logs out
         * Also reloads the current page to clear all potential caches
         */
        $rootScope.$on("sessionExpired", function () {
            obj.resetCurrentUserAndLogout();
            $timeout(function () {
                $window.location.reload();
            });
        });

        return obj;
    });
})();
