/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/contact_form using ngResource
     */
    module.factory('ContactFormRestService', function ($resource, restApiUrl) {
        'ngInject';

        // create ng-resource for api endpoint /api/contact_form
        return $resource(
            restApiUrl + 'contact_form/',
            {},
            {}
        );
    });
})();
