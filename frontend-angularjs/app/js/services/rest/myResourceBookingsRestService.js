/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/resourcebookings/my using ngResource
     */
    module.factory('MyResourceBookingsRestService', function (cachedResource, restApiUrl, ResourceBookingConverterService) {
        'ngInject';

        // create ng-resource for api endpoint /api/resourcebookings, with parameter resourcebookings id
        return cachedResource(
            restApiUrl + 'resourcebookings/my/:pk/',
            {pk: '@pk', resource: '@resource'},
            {
                'get': {
                    'method': 'GET',
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBookingArray
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBookingArray,
                    'interceptor': {
                        response: function (response) {
                            response.resource.$httpHeaders = response.headers;

                            return response.resource;
                        }
                    }
                },
                'delete': {
                    'method': 'DELETE',
                    'isArray': false
                },
                'update': {
                    'method': 'PUT',
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBooking
                },
                // overwrite update partial method
                'updatePartial': {
                    'method': 'PATCH',
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBooking
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

    /**
     * Define API Endpoint for /api/resourcebookings/:pk/export/
     */
    module.factory('MyResourceBookingsRestServiceExport',function (restApiUrl, $http) {
        'ngInject';

        return {
            'export' : function (pk) {
                var url = restApiUrl + "resourcebookings/my/" + pk + "/export/";

                return $http.get(url, {responseType: 'arraybuffer'});
            },
            'export_many' : function (pkList) {
                var url = restApiUrl + "resourcebookings/my/export_many/" + pkList;

                return $http.get(url, {responseType: 'arraybuffer'});
            }
        }
    });
})();
