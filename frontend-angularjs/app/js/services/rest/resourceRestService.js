/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/resources using ngResource
     */
    module.factory('ResourceRestService', function (
        cachedResource,
        restApiUrl,
        userCacheService,
        PaginationCountHeader
    ) {
        'ngInject';

        /**
         * Transform Content Type Header to "undefined" if "terms_of_use_pdf" is set
         * @param request
         * @returns {*}
         */
        var transformContentTypeHeader = function (request) {
            if (request && request.data && request.data.terms_of_use_pdf) {
                return undefined;
            }

            return "application/json;charset=UTF-8";
        };

        /**
         * Transforms the "request" into a formdata object, if the content contains the "terms_of_use_pdf" attribute
         * @param data
         * @returns {*}
         */
        var transformFileRequest = function (data, headers) {
            if (data === undefined) {
                return data;
            }

            if (data.terms_of_use_pdf !== undefined && data.terms_of_use_pdf !== "" && data.terms_of_use_pdf !== null) {
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
                    convertResourceFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    convertResourceFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };

        var transformResponseForFile = function (data, headersGetter) {
            var resource = angular.fromJson(data);

            return convertResourceFromRestAPI(resource);
        };
        /**
         * add project_pk to the resource
         * @param resource
         * @returns {*}
         */
        var convertResourceFromRestAPI = function (resource) {
            resource.project_pk = resource.project;

            if (resource.created_by) {
                userCacheService.addUserToCache(resource.created_by);
            }
            if (resource.last_modified_by) {
                userCacheService.addUserToCache(resource.last_modified_by);
            }

            return resource;
        };


        // create ng-resource for api endpoint /api/resources, with parameter resources id
        return cachedResource(
            restApiUrl + 'resources/:pk/',
            {pk: '@pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'transformResponse': transformResponseForFile
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
                    'method': 'PUT',
                    transformRequest: transformFileRequest,
                    headers: {
                        'Content-Type': transformContentTypeHeader
                    }

                },
                // overwrite update partial method
                'updatePartial': {
                    'method': 'PATCH',
                    transformRequest: transformFileRequest,
                    headers: {
                        'Content-Type': transformContentTypeHeader
                    }
                },
                'softDelete': {
                    'url': restApiUrl + 'resources/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForFileArray
                },
                'restore': {
                    'url': restApiUrl + 'resources/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForFileArray
                },
                'downloadFile': {
                    'url': restApiUrl + 'resources/:pk/terms-of-use-download/',
                    'method': 'GET',
                    'transformResponse': transformResponseForFile
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: true
            }
        );
    });
    /**
     * Define API Endpoint for /api/resources/:pk/terms-of-use-download/
     */
    module.factory('TermsOfUseDownloadRestService',function (restApiUrl, $http) {
        'ngInject';

        return {
            'download' : function (url) {
                return $http.get(url, {responseType: 'arraybuffer'});
            }
        }
    });
})();
