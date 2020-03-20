/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Converts the JSON API response to data
     */
    function transformQueryResponse (data, headersGetter) {
        return angular.fromJson(data);
    }

    /**
     * Converts the data to JSON for the API
     */
    function dataToJson (data, headersGetter) {
        return angular.toJson(data);
    }

    /**
     * Loads data from /api/model/:model_pk/versions/
     */
    module.factory('VersionRestServiceFactory', function ($resource, restApiUrl) {
        'ngInject';

        return function (model_name, model_pk) {

            var url = restApiUrl + model_name + 's/' + model_pk + '/versions/';

            return $resource(
                url,
                {pk: '@pk'},
                {
                    'query': {
                        'method': 'GET',
                        'ignoreLoadingBar': true,
                        'transformResponse': transformQueryResponse
                    },
                    'create': {
                        'method': 'POST',
                        'transformRequest': dataToJson
                    },
                    'preview': {
                        'url': url + ':pk/preview/',
                        'method': 'GET'
                    },
                    'restore': {
                        'url': url + ':pk/restore/',
                        'method': 'POST'
                    }
                }
            );
        };
    });
})();
