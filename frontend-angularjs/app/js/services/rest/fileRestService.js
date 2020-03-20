/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/files using ngResource
     */
    module.factory('FileRestService',function (
        cachedResource,
        restApiUrl,
        userCacheService,
        PaginationCountHeader
    ) {
        'ngInject';

        /**
         * Transform Content Type Header to "undefined" if "path" is set
         * @param request
         * @returns {*}
         */
        var transformContentTypeHeader = function (request) {
            if (request && request.data && request.data.path) {
                return undefined;
            }

            return "application/json;charset=UTF-8";
        };

        /**
         * Transforms the "request" into a formdata object, if the content contains the "path" attribute
         * @param data
         * @returns {*}
         */
        var transformFileRequest = function (data, headers) {
            if (data === undefined) {
                return data;
            }

            if (data.path !== undefined && data.path != "") {
                var fd = new FormData();

                angular.forEach(data, function (value, key) {
                    if (value instanceof FileList) {
                        // formdata with file content
                        if (value.length == 1) {
                            fd.append(key, value[0]);
                        } else {
                            angular.forEach(value, function (file, index) {
                                fd.append(key + '_' + index, file);
                            });
                        }
                    } else if (value instanceof Array) {
                        // for arrays, we need to deconstruct the array (for form-data to work)
                        for (var i = 0; i < value.length; i++) {
                            fd.append(key, value[i]);
                        }
                    } else {
                        // any other key
                        fd.append(key, value);
                    }
                });

                return fd;
            }

            return angular.toJson(data);
        };

        var transformResponseForFileArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    convertFileFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    convertFileFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };

        var transformResponseForFile = function (data, headersGetter) {
            var file = angular.fromJson(data);

            return convertFileFromRestAPI(file);
        };
        /**
         * add project_pk to the file
         * @param file
         * @returns {*}
         */
        var convertFileFromRestAPI = function (file) {
            file.project_pk = file.project;

            if (file.created_by) {
                userCacheService.addUserToCache(file.created_by);
            }
            if (file.last_modified_by) {
                userCacheService.addUserToCache(file.last_modified_by);
            }

            return file;
        };

        // create cached ng-resource for api endpoint /api/project/pk/files
        return cachedResource(
            restApiUrl + 'files/:pk/',
            {pk: '@pk', project: '@filter_by_project_pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancelable': true,
                    'isArray': true,
                    'transformResponse': transformResponseForFileArray
                },
                'create': {
                    method: 'POST',
                    transformRequest: transformFileRequest,
                    headers: {
                        'Content-Type': transformContentTypeHeader
                    }
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': transformResponseForFile
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': transformResponseForFileArray,
                    'interceptor': {
                        response: function (response) {
                            response.resource.$httpHeaders = response.headers;

                            return response.resource;
                        }
                    }
                },
                'update': {
                    method: 'PUT',
                    transformRequest: transformFileRequest,
                    headers: {
                        'Content-Type': transformContentTypeHeader
                    }
                },
                'updatePartial': {
                    method: 'PATCH',
                    transformRequest: transformFileRequest,
                    headers: {
                        'Content-Type': transformContentTypeHeader
                    }
                },
                'softDelete': {
                    'url': restApiUrl + 'files/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForFileArray
                },
                'restore': {
                    'url': restApiUrl + 'files/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForFileArray
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
    /**
     * Define API Endpoints for /api/project/:project/file/:pk/download/
     * and for /api/project/:project/file/:pk/download/?version=:version
     */
    module.factory('FileDownloadRestService',function (restApiUrl, $http) {
        'ngInject';

        return {
            'download' : function (url) {
                return $http.get(url, {responseType: 'arraybuffer'});
            },
            'downloadRevision' : function (url, version) {
                return $http.get(url + "?version=" + version, {responseType: 'arraybuffer'});
            }
        }
    });
})();
