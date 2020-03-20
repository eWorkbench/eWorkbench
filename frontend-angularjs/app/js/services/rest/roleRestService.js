/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/roles using ngResource
     */
    module.factory('RolesRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        // create ng-resource for api endpoint /api/projects, with parameter project id
        return cachedResource(
            restApiUrl + 'roles/:pk/',
            {pk: '@pk'},
            {},
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: false,
                relatedCaches: []
            }
        );
    });

})();
