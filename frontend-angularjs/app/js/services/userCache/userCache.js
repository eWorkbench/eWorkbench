/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    module.service('userCacheService', function () {

        var _cachedUsers = {};

        var service = {
        };

        service.addUserToCache = function (user) {
            _cachedUsers[user.pk] = user;
        };

        service.getUserFromCache = function (user_pk) {
            return _cachedUsers[user_pk];
        };

        return service;
    });
})();
