/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/dsscontainers using ngResource
     */
    module.factory('DSSContainerRestService', function (cachedResource, restApiUrl, PaginationConverterService) {
        'ngInject';

        // create ng-resource for api endpoint /api/meetings, with parameter meetings id
        return cachedResource(
            restApiUrl + 'dsscontainers/:pk/',
            {pk: '@pk', projects: '@filter_by_project_pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': PaginationConverterService.transformResponseForArray
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': PaginationConverterService.transformResponseForArray
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': PaginationConverterService.transformResponseForArray,
                    'interceptor': {
                        response: function (response) {
                            response.resource.$httpHeaders = response.headers;

                            return response.resource;
                        }
                    }
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: true,
                relatedCaches: []
            }
        );
    });
})();
