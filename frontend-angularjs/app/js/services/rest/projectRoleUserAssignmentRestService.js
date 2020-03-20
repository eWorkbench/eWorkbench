/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/project_role_user_assignment using ngResource
     */
    module.factory('ProjectRoleUserAssignmentRestServiceFactory', function (
        cachedResource,
        restApiUrl,
        userCacheService
    ) {
        'ngInject';

        var transformRequestForAssignment = function (data, headersGetter) {
            if (angular.isObject(data.user)) {
                data.user_pk = data.user.pk;
            }

            if (angular.isObject(data.role)) {
                data.role_pk = data.role.pk;
            }

            return angular.toJson(data);
        };

        var transformResponseForAssignment = function (data) {
            var arr = angular.fromJson(data);

            // iterate over array and collect the assigned user
            for (var i = 0; i < arr.length; i++) {
                userCacheService.addUserToCache(arr[i].user);
            }

            return arr;
        };


        return function (projectPk) {
            return cachedResource(
                restApiUrl + 'projects/' + projectPk + '/acls/:pk/',
                {pk: '@pk'},
                {
                    // overwrite create method
                    'create': {
                        'method': 'POST',
                        'transformRequest': transformRequestForAssignment
                    },
                    // overwrite create method
                    'update': {
                        'method': 'PUT',
                        'transformRequest': transformRequestForAssignment
                    },
                    'getAssignmentsUp': {
                        'method': 'GET',
                        'url': restApiUrl + 'projects/' + projectPk + '/acls/:pk/get_assigned_users_up/',
                        'isArray': true,
                        'transformResponse': transformResponseForAssignment
                    }
                },
                {
                    keyName: 'pk',
                    cacheTimeoutInSeconds: 30, // seconds
                    invalidateCacheOnUpdates: false,
                    invalidateCacheOnInsert: false,
                    relatedCaches: []
                }
            );
        }
    });

})();
