/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/my/meetings using ngResource
     */
    module.factory('MyMeetingRestService', function (cachedResource, restApiUrl, MeetingConverterService) {
        'ngInject';

        // create ng-resource for api endpoint /api/meetings, with parameter meetings id
        return cachedResource(
            restApiUrl + 'my/meetings/:pk/',
            {pk: '@pk'},
            {
                'get': {
                    'method': 'GET',
                    'transformResponse': MeetingConverterService.transformResponseForMeeting
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': MeetingConverterService.transformResponseForMeetingArray
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
