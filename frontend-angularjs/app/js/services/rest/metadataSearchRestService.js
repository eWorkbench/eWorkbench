/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('services');

    /**
     * Converts the data to JSON for the API.
     */
    function dataToJson (data, headersGetter) {
        return angular.toJson(data);
    }

    /**
     * Service to call the metadata-search API.
     */
    module.factory('MetadataSearchRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        return cachedResource(
            restApiUrl + 'metadata-search/',
            {
                // no URL params
            },
            {
                'search': {
                    'method': 'POST',
                    'transformRequest': dataToJson,
                    'isArray': true
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 0
            });
    });
})();
