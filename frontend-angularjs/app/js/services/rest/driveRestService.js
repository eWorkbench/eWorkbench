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
    module.factory('DriveRestService', function (
        cachedResource,
        restApiUrl,
        userCacheService,
        PaginationCountHeader
    ) {
        'ngInject';

        var transformResponseForDriveArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    convertDriveFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    convertDriveFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };
        var transformResponseForDrive = function (data, headersGetter) {
            var drive = angular.fromJson(data);


            return convertDriveFromRestAPI(drive);
        };
        /**
         * add project_pk to the drive
         * @param drive
         * @returns {*}
         */
        var convertDriveFromRestAPI = function (drive) {
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
            restApiUrl + 'drives/:pk/',
            {pk: '@pk', project: '@filter_by_project_pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': transformResponseForDriveArray
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': transformResponseForDrive
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': transformResponseForDriveArray,
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
                'softDelete': {
                    'url': restApiUrl + 'drives/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForDriveArray
                },
                'restore': {
                    'url': restApiUrl + 'drives/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForDriveArray
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

    module.factory('DriveSubDirectoryRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        return function (drivePk) {
            return cachedResource(
                restApiUrl + 'drives/' + drivePk + '/sub_directories/:pk/',
                {pk: '@pk'},
                {
                },
                {
                    keyName: 'pk',
                    cacheTimeoutInSeconds: 60, // seconds
                    invalidateCacheOnUpdates: false,
                    invalidateCacheOnInsert: false,
                    relatedCaches: []
                }
            )
        };
    });
})();
