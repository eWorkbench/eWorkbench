/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/my/tasks using ngResource
     */
    module.factory('MyTaskRestService', function (cachedResource, restApiUrl, TaskConverterService) {
        'ngInject';

        // create ng-resource for api endpoint /api/meetings, with parameter meetings id
        return cachedResource(
            restApiUrl + 'my/tasks/',
            {},
            {
                'get': {
                    'method': 'GET',
                    'transformResponse': TaskConverterService.transformResponseForTask
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': TaskConverterService.transformResponseForTaskArray
                },
                'delete': {
                    'method': 'DELETE',
                    'isArray': false
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
                cacheTimeoutInSeconds: 5, // seconds
                invalidateCacheOnUpdates: false,
                relatedCaches: []
            }
        );
    });

})();
