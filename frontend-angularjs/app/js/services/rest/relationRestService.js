/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/relations using ngResource
     */
    module.factory('RelationsRestServiceFactory', function (cachedResource, restApiUrl, userCacheService) {
        'ngInject';

        var convertRelationFromRestAPI = function (relation) {
            // do not convert objects that do not contain an actual relation
            // this is the case when rest api throws an error
            if (!relation.pk) {
                return relation;
            }

            if (relation.user) {
                userCacheService.addUserToCache(relation.user);
            }

            return relation;
        };

        var transformResponseForRelation = function (data, headersGetter) {
            var relation = angular.fromJson(data);

            return convertRelationFromRestAPI(relation);
        };

        var transformResponseForRelationArray = function (data, headersGetter) {
            var list = angular.fromJson(data);

            for (var i = 0; i < list.length; i++) {
                convertRelationFromRestAPI(list[i]);
            }

            return list;
        };

        return function (modelName, modelPk, ignoreLoadingBar) {
            // build a new $resource for a given project primary key,
            // a model name (e.g., task), and a modelPk (e.g., a task pk)

            // if no ignoreLoadingBar is defined, default is true
            if ( typeof (ignoreLoadingBar) === "undefined" ) {
                ignoreLoadingBar = true;
            }

            return cachedResource(
                restApiUrl + modelName + 's/' + modelPk + '/relations/:pk/',
                {
                    pk: '@pk'
                },
                {
                    'create': {
                        'method': 'POST',
                        'transformResponse': transformResponseForRelation
                    },
                    'get': {
                        'method': 'GET',
                        'transformResponse': transformResponseForRelation,
                        'ignoreLoadingBar': true
                    },
                    'query': {
                        'method': 'GET',
                        'isArray': true,
                        'transformResponse': transformResponseForRelationArray,
                        'ignoreLoadingBar': ignoreLoadingBar
                    },
                    'update': {
                        'method': 'PUT',
                        'transformResponse': transformResponseForRelation
                    },
                    'updatePartial': {
                        'method': 'PATCH',
                        'transformResponse': transformResponseForRelation
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
        };
    });
})();
