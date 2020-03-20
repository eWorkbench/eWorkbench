/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    module.service('UiSettingsService', function (
        $q,
        AuthRestService
    ) {
        var service = {};

        var init = function () {
            var user = AuthRestService.getCurrentUser();

            service.loadUserSettings(user);
        };

        service.save = function (key, value) {
            var defer = $q.defer();

            service.settings[key] = value;

            service.user.userprofile.ui_settings = service.settings;

            // delete avatar property to avoid error "avatar is not a file"
            delete service.user.userprofile.avatar;

            service.user.$update().then(
                function success (response) {
                    defer.resolve();
                },
                function error (rejection) {
                    console.log(rejection);
                    defer.reject();
                }
            );

            return defer.promise;
        };

        service.getSaved = function (key) {
            return service.settings[key] || null;
        };

        service.loadUserSettings = function (user) {
            service.user = user;
            service.settings = service.user.userprofile.ui_settings || {};
        };

        init();

        return service;
    });
})();
