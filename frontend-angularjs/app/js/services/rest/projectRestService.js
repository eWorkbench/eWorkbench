/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/projects using ngResource
     */
    module.factory('ProjectRestService', function (cachedResource, restApiUrl, PaginationCountHeader) {
        'ngInject';

        var transformResponseForProjectArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    convertProjectFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    convertProjectFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };

        var transformResponseForProject = function (data, headersGetter, status) {
            var project = angular.fromJson(data);

            // do not convert the response if the status code is an error (e.g., 40x)
            if (status === undefined || (status >= 200 && status < 300)) {
                return convertProjectFromRestAPI(project);
            }

            return project;
        };

        /**
         * add project_pk, start and end to the meeting
         *    start and end are used for the angular ui calendar
         * convert date_time_start and date_time_end
         * @param project
         * @returns {*}
         */
        var convertProjectFromRestAPI = function (project) {
            // need to set from and to for gantt chart
            if (project.start_date && project.start_date !== "") {
                project.from = project.start_date;
            }
            if (project.stop_date && project.stop_date !== "") {
                project.to = project.stop_date;
            }

            if (project.start_date) {
                project.start_date = moment(project.start_date);
            }
            if (project.stop_date) {
                project.stop_date = moment(project.stop_date);
            }

            return project;
        };

        // create ng-resource for api endpoint /api/projects, with parameter project id
        return cachedResource(
            restApiUrl + 'projects/:pk/',
            {pk: '@pk'},
            {
                // overwrite create method
                'create': {
                    'method': 'POST',
                    'transformResponse': transformResponseForProject
                },
                // search for user
                'searchUser': {
                    'ignoreLoadingBar': true,
                    'url': restApiUrl + 'projects/:pk/users/',
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true
                },
                'searchTree': {
                    'ignoreLoadingBar': true,
                    'url': restApiUrl + 'projecttree/',
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true
                },
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': transformResponseForProjectArray
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': transformResponseForProject
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': transformResponseForProjectArray,
                    'interceptor': {
                        response: function (response) {
                            response.resource.$httpHeaders = response.headers;

                            return response.resource;
                        }
                    }
                },
                'update': {
                    'method': 'PUT',
                    'transformResponse': transformResponseForProject
                },
                'updatePartial': {
                    'method': 'PATCH',
                    'transformResponse': transformResponseForProject
                },
                'softDelete': {
                    'url': restApiUrl + 'projects/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForProjectArray
                },
                'restore': {
                    'url': restApiUrl + 'projects/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForProjectArray
                },
                'duplicate': {
                    'url': restApiUrl + 'projects/:pk/duplicate/',
                    'method': 'POST',
                    'isArray': false,
                    'transformResponse': transformResponseForProject
                },
                'getTree': {
                    'method': 'GET',
                    'transformResponse': transformResponseForProject,
                    'url': restApiUrl + 'projecttree/:pk/'
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: false,
                relatedCaches: ['ResourceRestService', 'ProjectBreadcrumbRestService']
            }
        );
    });
})();
