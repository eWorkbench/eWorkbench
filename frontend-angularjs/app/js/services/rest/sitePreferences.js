/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/site_preferences/ using ngResource
     */
    module.factory('SitePreferencesRestService', function ($resource, restApiUrl) {
        'ngInject';

        // create ng-resource for api endpoint /api/site_preferences
        return $resource(restApiUrl + 'site_preferences/');
    });

    /**
     * Singleton for Site Preferences
     * Provides an object with preferences
     */
    module.factory('SitePreferences', function (SitePreferencesRestService) {
        'ngInject';

        var obj = {
            preferences: SitePreferencesRestService.get()
        };

        obj.preferences.$promise.then(
            function success (response) {
                return response;
            },
            function error (rejection) {
                console.log("Failed to get site preferences...");
                console.log(rejection);
            }
        );

        return obj;
    })
})();
