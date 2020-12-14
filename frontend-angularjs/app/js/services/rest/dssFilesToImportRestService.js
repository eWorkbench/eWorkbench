/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('services');

    /**
     * Define API Endpoint for /api/dsscontainers using ngResource
     */
    module.factory('DSSContainerRestService', function (cachedResource, restApiUrl, DSSContainerConverterService) {
        'ngInject';

        // create cached ng-resource for api endpoint /api/project/pk/dsscontainers
        return cachedResource(
            restApiUrl + 'dsscontainers/:pk/',
            {pk: '@pk', project: '@filter_by_project_pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': DSSContainerConverterService.transformResponseForDSSContainerArray
                },
                'create': {
                    'method': 'POST',
                    'transformResponse': DSSContainerConverterService.transformResponseForDSSContainer
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': DSSContainerConverterService.transformResponseForDSSContainer
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': DSSContainerConverterService.transformResponseForDSSContainerArray,
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


    /**
     * Define API Endpoint for /api/dssfilestoimport/ using ngResource
     */
    module.factory('DSSFilesToImportRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        // create cached ng-resource for api endpoint /api/project/pk/dsscontainers
        return cachedResource(
            restApiUrl + 'dssfilestoimport/',
            {pk: '@pk', project: '@filter_by_project_pk'},
            {
                'create': {
                    method: 'POST',
                    isArray: false,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: true,
                invalidateCacheOnInsert: true,
                relatedCaches: []
            }
        );
    });

})();
