/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('services');

    module.factory('ElementLabelRestService', function (cachedResource, restApiUrl) {
        'ngInject';

        return cachedResource(
            restApiUrl + 'element_labels/:pk/',
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
