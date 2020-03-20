/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/usergroups using ngResource
     */
    module.factory('UserGroupRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        return cachedResource(
            restApiUrl + 'usergroups/:pk/',
            {pk: '@pk'},
            {
                'search':
                {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 120, // seconds
                invalidateCacheOnUpdates: false,
                relatedCaches: []
            });
    });
})();
