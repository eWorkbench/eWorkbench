/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/meetings using ngResource
     */
    module.factory('MeetingRestService', function (cachedResource, restApiUrl, MeetingConverterService) {
        'ngInject';

        // create ng-resource for api endpoint /api/meetings, with parameter meetings id
        return cachedResource(
            restApiUrl + 'meetings/:pk/',
            {pk: '@pk', projects: '@filter_by_project_pk'},
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
                    'transformResponse': MeetingConverterService.transformResponseForMeeting
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': MeetingConverterService.transformResponseForMeetingArray,
                    'interceptor': {
                        response: function (response) {
                            response.resource.$httpHeaders = response.headers;

                            return response.resource;
                        }
                    }
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
                'softDelete': {
                    'url': restApiUrl + 'meetings/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': MeetingConverterService.transformResponseForMeetingArray
                },
                'restore': {
                    'url': restApiUrl + 'meetings/:pk/restore/',
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
                relatedCaches: ['MyMeetingRestService']
            }
        );
    });

    module.factory('MeetingsRestServiceExport',function (restApiUrl, $http) {
        'ngInject';

        return {
            'export' : function (project_pk) {
                var url = restApiUrl + "meetings/export/?project_pk=" + project_pk;

                return $http.get(url, {responseType: 'arraybuffer'});
            }
        }
    });
})();
