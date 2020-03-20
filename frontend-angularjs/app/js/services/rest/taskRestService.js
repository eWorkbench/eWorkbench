/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/projects/:project_pk/tasks/ using ngResource
     */
    module.factory('TaskRestService', function (cachedResource, restApiUrl, TaskConverterService) {
        'ngInject';


        return cachedResource(
            restApiUrl + 'tasks/:pk/',
            {pk: '@pk', project: '@filter_by_project_pk'},
            {
                // overwrite create method
                'create': {
                    'method': 'POST',
                    'transformResponse': TaskConverterService.transformResponseForTask
                },
                // overwrite update method
                'update': {
                    'method': 'PUT',
                    'transformResponse': TaskConverterService.transformResponseForTask
                },
                // overwrite update partial method
                'updatePartial': {
                    'method': 'PATCH',
                    'transformResponse': TaskConverterService.transformResponseForTask
                },
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': TaskConverterService.transformResponseForTaskArray
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': TaskConverterService.transformResponseForTask
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': TaskConverterService.transformResponseForTaskArray,
                    'interceptor': {
                        response: function (response) {
                            response.resource.$httpHeaders = response.headers;

                            return response.resource;
                        }
                    }
                },
                'softDelete': {
                    'url': restApiUrl + 'tasks/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': TaskConverterService.transformResponseForTaskArray
                },
                'restore': {
                    'url': restApiUrl + 'tasks/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': TaskConverterService.transformResponseForTaskArray
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
