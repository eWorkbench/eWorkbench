/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * API Endpoint for /api/projects/:project_pk/users/:user_pk
     */
    module.factory('ProjectUserRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        // create ng-resource for api endpoint /api/projects, with parameter project id
        return cachedResource(
            restApiUrl + 'projects/:project/users/:pk/',
            {pk: '@pk', project: '@project'},
            {},
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 120, // seconds
                invalidateCacheOnUpdates: false,
                relatedCaches: []
            }
        );
    });

    /**
     * Define API Endpoint for /api/users using ngResource
     */
    module.factory('UserRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        // create ng-resource for api endpoint /api/projects, with parameter project id
        return cachedResource(
            restApiUrl + 'users/:pk/',
            {pk: '@pk'},
            {
                'search':
                {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true
                },
                'inviteUser':
                {
                    'method': 'POST',
                    'isArray': false,
                    'url': restApiUrl + 'users/invite_user/'
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
