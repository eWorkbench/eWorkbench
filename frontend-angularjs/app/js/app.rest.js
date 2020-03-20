/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        app = angular.module('app');

    /**
     * Intercept REST Requests
     * - adds the authorization header on requests to restApiUrl (but not to other requests, like .html or .js files)
     * - handles response with http status 401 (not authorized)
     */
    app.service('AuthRestStatusInterceptorService',
        function ($rootScope, $injector, toaster, $q, $state, gettext, AuthLocalStorageService, restApiUrl) {
            "nginject";

            /**
             * gets the current token
             * @returns {null}
             */
            var getCurrentToken = function () {
                // check if currentToken is already set, and if not, update it from local storage
                return AuthLocalStorageService.getToken();
            };

            return {
                /**
                 * On each request, add a Token to the header (if a token exists in local storage)
                 * @param config
                 * @returns {*|Promise}
                 */
                request: function (config) {
                    config.headers = config.headers || {};

                    // set the token only for requests to our Rest API
                    if (config.url && config.url.indexOf(restApiUrl) >= 0) {
                        var token = getCurrentToken();

                        if (token) {
                            config.headers.Authorization = "Token " + token;
                        }
                    }

                    return config || $q.when(config);
                },
                /**
                 * Check the error response for status code 401 -> unauthorized
                 * @param response
                 * @returns {Promise}
                 */
                responseError: function (response) {
                    if (response.status == -1) {
                        // server not available
                        toaster.pop('error', gettext("Server offline"),
                            gettext("Try again in a couple of minutes"));

                        if (response.config.url.indexOf('js_error_logger')) {
                            // do not re-send an error because logging of the error failed...
                            console.error("js_error_logger did not work... stopping");

                            return $q.reject(response);
                        }

                        // log this error
                        var $window = $injector.get('$window');
                        var $http = $injector.get('$http');

                        var exceptionData = angular.toJson({
                            error_url: $window.location.href,
                            backend_version: "",
                            error_message: "Server Offline",
                            stack_trace: response,
                            cause: "responseError"
                        });

                        // post exceptionData to the backend
                        $http.post(restApiUrl + "js_error_logger/", exceptionData).then();

                        return $q.reject(response);
                    }

                    // verify response has a config object and an url, and a token is set
                    if (response && response.config && response.config.url &&
                        response.config.url.indexOf(restApiUrl) >= 0 && getCurrentToken()) {
                        if (response.config.url.indexOf('/me') > 0 &&
                            response.config.url.indexOf('/meetings') < 0 &&
                            response.config.url.indexOf('/update_avatar') < 0
                        ) {
                            // 400 is a validation error, e.g. when updating the user profile
                            if (response.status != 400) {
                                toaster.pop('error', gettext("Session expired"));
                                // reset token
                                AuthLocalStorageService.resetToken();
                                // broadcast a sessionExpired for AuthRestService
                                // Note: we can not DI AuthRestService here, as this would lead to a cyclic redundancy
                                $rootScope.$broadcast("sessionExpired");
                            }
                        } else if (response.config.url.indexOf('/auth') < 0) {
                            if (response.status == 401) { // not authorized
                                console.log('ERROR: expected a response, but found status 401 -> ' +
                                    'either a logout or session expired ...');
                                //AuthRestService.isLoggedIn = false;
                                toaster.pop('error', gettext("Session expired"));

                                // reset token
                                AuthLocalStorageService.resetToken();
                                // broadcast a sessionExpired for AuthRestService
                                // Note: we can not DI AuthRestService here, as this would lead to a cyclic redundancy
                                $rootScope.$broadcast("sessionExpired");
                            } else if (response.status == 403) { // forbidden
                                console.log('Permission denied');
                                toaster.pop('error', gettext("Permission denied"));
                            }
                        }
                    }

                    // always reject
                    return $q.reject(response);
                }
            };
        });


    /**
     * Configure REST API
     */
    app.config(function ($resourceProvider, $httpProvider, $cookiesProvider) {
        'ngInject';

        $cookiesProvider.defaults.path = "/";

        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

        // Don't strip trailing slashes from calculated URLs
        $resourceProvider.defaults.stripTrailingSlashes = false;

        // default actions
        $resourceProvider.defaults.actions = {
            'get': {'method': 'GET'},
            'query': {'method': 'GET', 'isArray': true, 'cancellable': true},
            'create': {'method': 'POST'},
            'update': {'method': 'PUT'},
            'updatePartial': {'method': 'PATCH'},
            'delete': {'method': 'DELETE'}
        };

        // push the http interceptor handling auth token aswell as authentication errors
        $httpProvider.interceptors.push('AuthRestStatusInterceptorService');
    });
})();

