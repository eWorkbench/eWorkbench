/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Allows locking and unlocking of any element (via /api/model/:model_pk/lock/ and /api/model/:model_pk/unlock/)
     */
    module.factory('ElementLockRestService', function ($resource, restApiUrl) {
        'ngInject';

        return function (model_name, model_pk) {

            var baseUrl = restApiUrl + model_name + 's/' + model_pk + '/';

            return $resource(
                baseUrl,
                {pk: '@pk'},
                {
                    'get': {
                        'ignoreLoadingBar': true,
                        'url': baseUrl + 'lock_status/',
                        'method': 'GET'
                    },
                    'lock': {
                        'ignoreLoadingBar': true,
                        'url': baseUrl + 'lock/',
                        'method': 'POST'
                    },
                    'unlock': {
                        'ignoreLoadingBar': true,
                        'url': baseUrl + 'unlock/',
                        'method': 'POST'
                    }
                }
            );
        };
    });
})();
