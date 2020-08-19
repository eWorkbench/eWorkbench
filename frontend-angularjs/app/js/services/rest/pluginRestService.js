/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/plugins using ngResource
     */
    module.factory('PluginRestService', function (cachedResource, restApiUrl, userCacheService) {
        'ngInject';

        /**
         * Transform request and fetch cached users
         * @param data
         * @returns {*}
         */

        var transformResponseForPluginArray = function (data) {
            var list = angular.fromJson(data);

            for (var i = 0; i < list.length; i++) {
                convertPluginFromRestAPI(list[i]);
            }

            return list;
        };
        var transformResponseForPlugin = function (data) {
            var plugin = angular.fromJson(data);

            return convertPluginFromRestAPI(plugin);
        };
        /**
         * fetch cached user-data
         * @param plugin
         * @returns {*}
         */
        var convertPluginFromRestAPI = function (plugin) {
            if (plugin.created_by) {
                userCacheService.addUserToCache(plugin.created_by);
            }
            if (plugin.last_modified_by) {
                userCacheService.addUserToCache(plugin.last_modified_by);
            }

            return plugin;
        };

        // create cached ng-resource for api endpoint /api/project/pk/plugininstances
        return cachedResource(
            restApiUrl + 'plugins/:pk/',
            {pk: '@pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': transformResponseForPluginArray
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': transformResponseForPlugin
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': transformResponseForPluginArray
                },
                'feedback':
                {
                    'method': 'POST',
                    'isArray': false,
                    'url': restApiUrl + 'plugins/feedback/'
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
     * Define API Endpoint for /api/plugininstances using ngResource
     */
    module.factory('PlugininstanceRestService', function (cachedResource, restApiUrl, userCacheService,
        PaginationCountHeader) {
        'ngInject';

        /**
         * Transforms the "request" into a formdata object, if the content contains the "path" attribute
         * @param data
         * @returns {*}
         */
        var transformPlugininstanceRequest = function (data) {
            if (data === undefined) {
                return data;
            }

            return angular.toJson(data);
        };

        var transformResponseForPlugininstanceArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    convertPlugininstanceFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    convertPlugininstanceFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };

        var transformResponseForPlugininstance = function (data) {
            var plugininstance = angular.fromJson(data);

            return convertPlugininstanceFromRestAPI(plugininstance);
        };
        /**
         * add project_pk to the plugininstance
         * @param plugininstance
         * @returns {*}
         */
        var convertPlugininstanceFromRestAPI = function (plugininstance) {
            plugininstance.project_pk = plugininstance.project;

            if (plugininstance.created_by) {
                userCacheService.addUserToCache(plugininstance.created_by);
            }
            if (plugininstance.last_modified_by) {
                userCacheService.addUserToCache(plugininstance.last_modified_by);
            }

            return plugininstance;
        };

        // create cached ng-resource for api endpoint /api/project/pk/plugininstances
        return cachedResource(
            restApiUrl + 'plugininstances/:pk/',
            {pk: '@pk', project: '@filter_by_project_pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': transformResponseForPlugininstanceArray
                },
                'create': {
                    method: 'POST',
                    transformRequest: transformPlugininstanceRequest
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': transformResponseForPlugininstance
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': transformResponseForPlugininstanceArray,
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
                    'url': restApiUrl + 'plugininstances/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForPlugininstanceArray
                },
                'restore': {
                    'url': restApiUrl + 'plugininstances/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForPlugininstanceArray
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
     * Define API Endpoints for /api/project/plugininstances/:pk/download/
     */
    module.factory('PlugininstanceDownloadRestService',function (restApiUrl, $http) {
        'ngInject';

        return {
            'download' : function (url) {
                return $http.get(url, {responseType: 'arraybuffer'});
            }
        }
    });
})();
