/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/resourcebookings using ngResource
     */
    module.factory('ResourceBookingsRestService', function (cachedResource, restApiUrl, ResourceBookingConverterService) {
        'ngInject';

        // create ng-resource for api endpoint /api/resourcebookings, with parameter resourcebookings id
        return cachedResource(
            restApiUrl + 'resourcebookings/:pk/',
            {pk: '@pk', resource: '@resource', projects: '@filter_by_project_pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBookingArray
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBookingArray
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBookingArray
                },
                'update': {
                    'method': 'PUT',
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBooking
                },
                // overwrite update partial method
                'updatePartial': {
                    'method': 'PATCH',
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBooking
                },
                'create': {
                    'method': 'POST',
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBooking
                },
                'delete': {
                    'method': 'DELETE',
                    'isArray': false
                },
                'softDelete': {
                    'url': restApiUrl + 'resourcebookings/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBookingArray
                },
                'restore': {
                    'url': restApiUrl + 'resourcebookings/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': ResourceBookingConverterService.transformResponseForResourceBookingArray
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: true,
                relatedCaches: ['MyResourceBookingsRestService']
            }
        );
    });
})();
