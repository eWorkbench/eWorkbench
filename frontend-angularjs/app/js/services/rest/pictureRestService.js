/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/pictures using ngResource
     */
    module.factory('PictureRestService', function (
        cachedResource,
        restApiUrl,
        userCacheService,
        PaginationCountHeader
    ) {
        'ngInject';

        /**
         * Transform Content Type Header to "undefined" if "background_image" is set
         * @param request
         * @returns {*}
         */
        var transformContentTypeHeader = function (request) {
            if (request && request.data && request.data.background_image) {
                return undefined;
            }

            return "application/json;charset=UTF-8";
        };

        /**
         * Transforms the "request" into a formdata object, if the content contains the "path" attribute
         * @param data
         * @returns {*}
         */
        var transformPictureRequest = function (data, headers) {
            if (data === undefined) {
                return data;
            }

            if (data.background_image !== undefined && data.background_image != "") {
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



        var transformResponseForPictureArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    convertPictureFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    convertPictureFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };
        var transformResponseForPicture = function (data, headersGetter) {
            var picture = angular.fromJson(data);


            return convertPictureFromRestAPI(picture);
        };
        /**
         * add project_pk to the picture
         * @param picture
         * @returns {*}
         */
        var convertPictureFromRestAPI = function (picture) {
            picture.project_pk = picture.project;

            if (picture.created_by) {
                userCacheService.addUserToCache(picture.created_by);
            }
            if (picture.last_modified_by) {
                userCacheService.addUserToCache(picture.last_modified_by);
            }

            return picture;
        };

        // create cached ng-resource for api endpoint /api/project/pk/pictures
        return cachedResource(
            restApiUrl + 'pictures/:pk/',
            {pk: '@pk', project: '@filter_by_project_pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': transformResponseForPictureArray
                },
                'create': {
                    method: 'POST',
                    transformRequest: transformPictureRequest,
                    headers: {
                        'Content-Type': transformContentTypeHeader
                    }
                },
                'get': {
                    'method': 'GET',
                    'ignoreLoadingBar': true,
                    'transformResponse': transformResponseForPicture
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'ignoreLoadingBar': true,
                    'transformResponse': transformResponseForPictureArray,
                    'interceptor': {
                        response: function (response) {
                            response.resource.$httpHeaders = response.headers;

                            return response.resource;
                        }
                    }
                },
                'softDelete': {
                    'url': restApiUrl + 'pictures/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForPictureArray
                },
                'restore': {
                    'url': restApiUrl + 'pictures/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForPictureArray
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: true,
                relatedCaches: []
            }
        );
    });

    /**
     * Define API Endpoints for /api/project/picture/:pk/shapes.json/
     */
    module.factory('PictureDownloadRestService',function (restApiUrl, $http) {
        'ngInject';

        return {
            'download' : function (url) {
                return $http.get(url, {responseType: 'arraybuffer'});
            }
        }
    });
})();
