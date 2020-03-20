/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    module.factory('TrashedItemsRestServiceFactory', function (cachedResource, restApiUrl, PaginationConverterService) {
        'ngInject';

        return function (modelName) {
            return cachedResource(
                restApiUrl + modelName + 's/:pk/?deleted=true',
                {
                    pk: '@pk'
                },
                {
                    'restore': {
                        'url': restApiUrl + modelName + 's/:pk/restore/',
                        'method': 'PATCH',
                        'isArray': false
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
        }
    });
})();
