/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for api/my/dashboard using ngResource
     */
    module.factory('DashboardService', function ($resource, restApiUrl) {
        'ngInject';

        // create ng-resource for api endpoint /api/my/dashboard
        return $resource(restApiUrl + 'my/dashboard/', {}, {
            'get': {
                'method': 'GET',
                'ignoreLoadingBar': true
            }
        });
    });
})();
