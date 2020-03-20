/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/dmpforms using ngResource
     */
    module.factory('DmpFormsRestService',function (cachedResource, restApiUrl) {
        'ngInject';

        // create ng-resource for api endpoint /api/dmpforms
        return cachedResource(
            restApiUrl + 'dmpforms/:pk/',
            {pk: '@pk'},
            {},
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 120, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: false,
                relatedCaches: ['DmpRestService']
            });
    });
})();
