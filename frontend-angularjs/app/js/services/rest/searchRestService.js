/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/search/ using ngResource
     */
    module.factory('SearchRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        // create ng-resource for api endpoint /api/projects, with parameter project id
        return cachedResource(
            restApiUrl + 'search/',
            {},
            {},
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 0
            });
    });
})();
