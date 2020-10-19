/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/resourcebookings/all using ngResource
     */
    module.factory('ResourceBookingsRestService', function (cachedResource, restApiUrl, MeetingConverterService) {
        'ngInject';

        // create ng-resource for api endpoint /api/resourcebookings, with parameter resourcebookings id
        return cachedResource(
            restApiUrl + 'resourcebookings/all/:pk/',
            {pk: '@pk', resource: '@resource', projects: '@filter_by_project_pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': MeetingConverterService.transformResponseForMeetingArray
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': MeetingConverterService.transformResponseForMeetingArray
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': MeetingConverterService.transformResponseForMeetingArray
                },
                'update': {
                    'method': 'PUT',
                    'transformResponse': MeetingConverterService.transformResponseForMeeting
                },
                // overwrite update partial method
                'updatePartial': {
                    'method': 'PATCH',
                    'transformResponse': MeetingConverterService.transformResponseForMeeting
                },
                'create': {
                    'method': 'POST',
                    'transformResponse': MeetingConverterService.transformResponseForMeeting
                },
                'delete': {
                    'method': 'DELETE',
                    'isArray': false
                },
                'softDelete': {
                    'url': restApiUrl + 'resourcebookings/all/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': MeetingConverterService.transformResponseForMeetingArray
                },
                'restore': {
                    'url': restApiUrl + 'resourcebookings/all/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': MeetingConverterService.transformResponseForMeetingArray
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
