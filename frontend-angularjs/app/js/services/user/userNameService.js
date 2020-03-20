/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Provides functionality to get the display name of a user.
     */
    module.service('UserNameService', function () {
        "ngInject";

        var service = {};

        service.getFullName = function (profile) {
            if (profile && profile.first_name && profile.last_name) {
                var firstName = profile.first_name.trim(),
                    lastName = profile.last_name.trim();

                if (firstName.length > 0 && lastName.length > 0) {
                    return profile.first_name + ' ' + profile.last_name;
                }
            }

            return null;
        };

        service.getFullNameOrUsername = function (user) {
            if (!user) {
                return null;
            }

            var display = service.getFullName(user.userprofile);

            if (!display) {
                display = user.username;
            }

            return display;
        };

        service.getFullNameMailOrUsername = function (user) {
            if (!user) {
                return null;
            }

            var display = service.getFullName(user.userprofile);

            if (!display) {
                display = user.email;

                if (!display) {
                    display = user.username;
                }
            }

            return display;
        };

        return service;
    });
})();
