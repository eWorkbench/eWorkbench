/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/history using ngResource
     */
    module.factory('HistoryRestService', function (cachedResource, restApiUrl, HistoryModelTypeService) {
        'ngInject';

        // create ng-resource for api endpoint /api/history
        return cachedResource(
            restApiUrl + 'history/:pk/',
            {pk: '@pk'},
            {
                'get': {
                    'method': 'GET',
                    'transformResponse': HistoryModelTypeService.transformResponseForHistory
                },
                'query': {
                    'method': 'GET',
                    'isArray': false,
                    'transformResponse': HistoryModelTypeService.transformResponseForHistoryArray
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 10, // seconds
                invalidateCacheOnUpdates: false,
                relatedCaches: []
            });
    });

    /**
     * Define API Endpoint for /api/model/:model_pk/history using ngResource
     */
    module.factory('DetailHistoryRestServiceFactory', function (cachedResource, restApiUrl) {
        'ngInject';

        return function (model_name, model_pk) {
            // build a new $resource for a given project primary key, a model name (e.g., task),
            // and a model_pk (e.g., a task pk)
            return cachedResource(
                restApiUrl + model_name + '/' + model_pk + '/history/:pk/',
                {
                    pk: '@pk'
                },
                {},
                {
                    keyName: 'pk',
                    cacheTimeoutInSeconds: 1, // seconds
                    invalidateCacheOnUpdates: false,
                    invalidateCacheOnInsert: false,
                    relatedCaches: []
                }
            );
        };
    });

    /**
     * Define API Endpoint for /api/model/:model_pk/history_paginated using ngResource
     */
    module.factory('PaginatedHistoryRestServiceFactory', function ($resource, restApiUrl, HistoryModelTypeService) {
        'ngInject';

        return function (model_name, model_pk, ignoreLoadingBar) {

            // if no ignoreLoadingBar is defined, default is true
            if ( typeof (ignoreLoadingBar) === "undefined" ) {
                ignoreLoadingBar = true;
            }

            var url = "";

            if (model_name && model_pk) {
                url = restApiUrl + model_name + 's/' + model_pk + '/history/';
            } else {
                url = restApiUrl + 'history/';
            }

            // builds a paginated history resource
            return $resource(
                url,
                {},
                {
                    'get': {
                        'method': 'GET',
                        'ignoreLoadingBar': ignoreLoadingBar,
                        'transformResponse': HistoryModelTypeService.transformResponseForHistory
                    },
                    'query': {
                        'method': 'GET',
                        'isArray': true,
                        'ignoreLoadingBar': ignoreLoadingBar,
                        'transformResponse': HistoryModelTypeService.transformResponseForHistoryArray
                    }
                }
            );
        };
    });
})();
