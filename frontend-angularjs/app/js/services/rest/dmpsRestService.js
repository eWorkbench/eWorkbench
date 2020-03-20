/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/dmps using ngResource
     */
    module.factory('DmpRestService',function (cachedResource, restApiUrl, DmpConverterService) {
        'ngInject';

        // create cached ng-resource for api endpoint /api/project/pk/dmps
        return cachedResource(
            restApiUrl + 'dmps/:pk/',
            {pk: '@pk', project: '@filter_by_project_pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': DmpConverterService.transformResponseForDmpArray
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': DmpConverterService.transformResponseForDmpArray,
                    'interceptor': {
                        response: function (response) {
                            response.resource.$httpHeaders = response.headers;

                            return response.resource;
                        }
                    }
                },
                'softDelete': {
                    'url': restApiUrl + 'dmps/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': DmpConverterService.transformResponseForDmpArray
                },
                'restore': {
                    'url': restApiUrl + 'dmps/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': DmpConverterService.transformResponseForDmpArray
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
     * Define API Endpoint for /api/project/:project/dmp/:pk/export/?type=:fileType
     */
    module.factory('DmpRestServiceExport',function (restApiUrl, $http) {
        'ngInject';

        return {
            'export' : function (dmpPk, fileType) {
                var url = restApiUrl + "dmps/" + dmpPk + "/export/?type=" + fileType;


                return $http.get(url, {responseType: 'arraybuffer'});
            }
        }
    });
})();
