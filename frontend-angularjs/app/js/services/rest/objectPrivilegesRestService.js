/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');


    /**
     * Define API Endpoint for /api/model/:model_pk/privileges/ using ngResource
     */
    module.factory('ObjectPrivilegesRestServiceFactory', function (
        $q,
        $resource,
        restApiUrl,
        AuthRestService
    ) {
        'ngInject';

        return function (param1, param2) {
            var url = "";

            // check if param1 contains the rest api url
            if (param1 && param1.indexOf(restApiUrl) >= 0 && !param2) {
                url = param1 + 'privileges/';
            } else if (param1 && param2) {
                // else: build rest api url with param1 as model name and param2 as the primary key
                var model_name = param1;
                var model_pk = param2;

                url = restApiUrl + model_name + '/' + model_pk + '/privileges/';
            }

            // build a new $resource for a given project primary key, a model name (e.g., task),
            // and a model_pk (e.g., a task pk)
            var resource = $resource(
                url + ':pk/',
                {
                    pk: '@user_pk'
                },
                {
                    'create': {
                        'method': 'POST',
                        // remove :pk from url for posts
                        'url': url
                    },
                    'get': {
                        'method': 'GET',
                        'isArray': false,
                        'ignoreLoadingBar': true
                    },
                    'reset': {
                        'url': url + ':pk/reset/',
                        'method': 'PUT',
                        'isArray': false,
                        'ignoreLoadingBar': true
                    }
                }
                // ,
                // {
                //     keyName: 'user_pk',
                //     cacheTimeoutInSeconds: 1, // seconds
                //     invalidateCacheOnUpdates: false,
                //     invalidateCacheOnInsert: true,
                //     relatedCaches: []
                // }
            );

            /**
             * gets privileges for the current user by using promises
             */
            resource.getPrivilegesForCurrentUser = function () {
                var loading = false;

                var defer = $q.defer();

                // wait for login and then get the current user
                AuthRestService.getWaitForLoginPromise().then(function () {
                    AuthRestService.getCurrentUser().$promise.then(
                        function ready (user) {
                            if (!loading) {
                                loading = true;

                                resource.get({'pk': user.pk}).$promise.then(
                                    function success (privileges) {
                                        defer.resolve(privileges);
                                    },
                                    function error (rejection) {
                                        defer.reject(rejection);
                                    }
                                );
                            }
                        }
                    );
                });

                return defer.promise;
            };

            return resource;
        };
    });
})();
