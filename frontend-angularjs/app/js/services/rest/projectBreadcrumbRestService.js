/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/projects/:project/breadcrumbs/ using ngResource
     */
    module.factory('ProjectBreadcrumbRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        // create cached ng-resource for api endpoint /api/projects, with parameter project id
        return cachedResource(
            restApiUrl + 'projects/:project/breadcrumbs/:pk/',
            {pk: '@pk', project: '@project'},
            { },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: true,
                invalidateCacheOnInsert: true,
                relatedCaches: []
            }
        );
    });

})();
