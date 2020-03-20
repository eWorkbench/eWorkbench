/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/labbooks using cachedResource
     */
    module.factory('LabbookRestService', function (cachedResource, restApiUrl, PaginationConverterService) {
        'ngInject';

        return cachedResource(
            restApiUrl + 'labbooks/:pk/',
            {pk: '@pk', project: '@filter_by_project_pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
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
                },
                'softDelete': {
                    'url': restApiUrl + 'labbooks/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false
                },
                'restore': {
                    'url': restApiUrl + 'labbooks/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: true,
                relatedCaches: []
            });
    });

    module.factory('LabbookChildElementsRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        return function (labbookPk) {
            return cachedResource(
                restApiUrl + 'labbooks/' + labbookPk + '/elements/:pk/',
                {pk: '@pk'},
                {
                    'updateAll': {
                        'url': restApiUrl + 'labbooks/' + labbookPk + '/elements/update_all/',
                        'isArray': true,
                        'method': 'PUT'
                    },
                    'getSectionChildElements': {
                        'url': restApiUrl + 'labbooks/' + labbookPk + '/elements/:pk/get_section_childElements/',
                        'isArray': true,
                        'method': 'GET'
                    }
                },
                {
                    keyName: 'pk',
                    cacheTimeoutInSeconds: 60, // seconds
                    invalidateCacheOnUpdates: false,
                    invalidateCacheOnInsert: false,
                    relatedCaches: []
                }
            )
        };
    });

    /**
     * Define API Endpoint for /api/labbooksections using cachedResource
     */
    module.factory('LabbookSectionsRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        return cachedResource(
            restApiUrl + 'labbooksections/:pk/',
            {pk: '@pk'},
            {
                'updatePartial': {
                    method: 'PATCH'
                },
                'update': {
                    method: 'PUT'
                },
                'softDelete': {
                    'url': restApiUrl + 'labbooksections/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false
                },
                'restore': {
                    'url': restApiUrl + 'labbooksections/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: false,
                relatedCaches: []
            }
        );
    });
})();
