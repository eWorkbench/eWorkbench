/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('services');

    /**
     * Converts the JSON API response to data
     */
    function transformQueryResponse (data, headersGetter) {
        return angular.fromJson(data);
    }

    /**
     * Converts the data to JSON for the API
     */
    function dataToJson (data, headersGetter) {
        return angular.toJson(data);
    }

    /**
     * Converts a metadata object to a JSON string
     * @param metadata
     * @param headersGetter
     */
    function metadataToJson (metadata, headersGetter) {
        var jsonObject = {
            field: (metadata.field) ? metadata.field : null,
            values: metadata.values
        };

        return angular.toJson(jsonObject);
    }

    /**
     * REST service for /api/:model/:model_pk/metadata/[:pk]
     */
    module.factory('MetadataRestServiceFactory', function (cachedResource, restApiUrl) {
        'ngInject';

        return function (model_name, model_pk) {
            var url = restApiUrl + model_name + 's/' + model_pk + '/metadata/';

            return cachedResource(
                url,
                {pk: '@pk'},
                {
                    'query': {
                        'method': 'GET',
                        'transformResponse': transformQueryResponse,
                        'isArray': true
                    },
                    'create': {
                        'method': 'POST',
                        'transformRequest': metadataToJson
                    },
                    'update': {
                        'method': 'PATCH',
                        'url': url + ':pk/',
                        'transformRequest': metadataToJson
                    },
                    'delete': {
                        'method': 'DELETE',
                        'url': url + ':pk/'
                    }
                },
                {
                    keyName: 'pk',
                    cacheTimeoutInSeconds: 60,
                    invalidateCacheOnUpdates: true,
                    invalidateCacheOnInsert: true,
                    relatedCaches: []
                }
            );
        };
    });

    /**
     * REST service for /api/metadatafields/[:pk]
     */
    module.service('MetadataFieldsRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        var url = restApiUrl + 'metadatafields/';

        return cachedResource(
            url,
            {pk: '@pk'},
            {
                'query': {
                    'method': 'GET',
                    'transformResponse': transformQueryResponse,
                    'isArray': true
                },
                'create': {
                    'method': 'POST',
                    'transformRequest': dataToJson
                },
                'update': {
                    'method': 'PATCH',
                    'url': url + ':pk/',
                    'transformRequest': dataToJson
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60,
                invalidateCacheOnUpdates: true,
                invalidateCacheOnInsert: true,
                relatedCaches: []
            }
        );
    });
})();
