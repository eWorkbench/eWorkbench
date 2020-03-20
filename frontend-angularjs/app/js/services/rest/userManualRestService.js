/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/user_manual/:category_pk/ using ngResource
     */
    module.factory('UserManualCategoryRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        return cachedResource(
            restApiUrl + 'user_manual/:pk/',
            {pk: '@pk'},
            {},
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 120, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: false,
                relatedCaches: ['UserManualCategoryHelpTextRestServiceFactory']
            }
        );
    });

    /**
     * @ngdoc factory
     *
     * @name UserManualCategoryHelpTextRestServiceFactory
     *
     * @description REST Service for the help texts of a user category
     */
    module.factory('UserManualCategoryHelpTextRestServiceFactory', function (
        cachedResource,
        restApiUrl
    ) {
        "ngInject";

        return function (categoryPk) {
            return cachedResource(
                restApiUrl + 'user_manual/' + categoryPk + '/help_texts/:pk/',
                {pk: '@pk'},
                {
                },
                {
                    keyName: 'pk',
                    cacheTimeoutInSeconds: 15, // seconds
                    invalidateCacheOnUpdates: false,
                    invalidateCacheOnInsert: false,
                    relatedCaches: []
                }
            );
        };
    });


    module.factory('UserManualExporter', function (
        $http,
        restApiUrl
    ) {
        "ngInject";

        return {
            'export' : function () {
                return $http.get(restApiUrl + 'user_manual/export_user_manual/', {responseType: 'arraybuffer'});
            },
            'import' : function (zipfile) {
                var data = {
                    file: zipfile
                };

                return $http.post(
                    restApiUrl + 'user_manual/import_user_manual/',
                    data,
                    {
                        headers: {'Content-Type': undefined},
                        transformRequest: function (data, headersGetter) {
                            var formData = new FormData();

                            angular.forEach(data, function (value, key) {
                                formData.append(key, value);
                            });

                            return formData;
                        }
                    }
                );
            }
        }
    });
})();
