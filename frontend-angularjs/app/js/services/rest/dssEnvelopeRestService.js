/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/drives using ngResource
     */
    module.factory('DSSEnvelopeRestService', function (
        cachedResource,
        restApiUrl,
        userCacheService,
        PaginationCountHeader
    ) {
        'ngInject';

        var transformResponseForEnvelopeArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    convertEnvelopeFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    convertEnvelopeFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };
        var transformResponseForEnvelope = function (data, headersGetter) {
            var drive = angular.fromJson(data);


            return convertEnvelopeFromRestAPI(drive);
        };
        /**
         * add project_pk to the drive
         * @param drive
         * @returns {*}
         */
        var convertEnvelopeFromRestAPI = function (drive) {
            drive.project_pk = drive.project;

            if (drive.created_by) {
                userCacheService.addUserToCache(drive.created_by);
            }
            if (drive.last_modified_by) {
                userCacheService.addUserToCache(drive.last_modified_by);
            }

            return drive;
        };

        // create cached ng-resource for api endpoint /api/project/pk/drives
        return cachedResource(
            restApiUrl + 'dssenvelopes/:pk/',
            {pk: '@pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': transformResponseForEnvelopeArray
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': transformResponseForEnvelope
                },
                'query': {
                    'method': 'GET',
                    'isArray': false,
                    'transformResponse': transformResponseForEnvelope,
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
            });
    });
})();
