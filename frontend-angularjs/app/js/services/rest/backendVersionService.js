/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    module.service('BackendVersionService', function ($http, restApiUrl, $q) {
        "ngInject";

        // get current backend version
        var backendVersion = $q.defer();

        $http.get(restApiUrl + "version").then(
            function (response) {
                backendVersion.resolve(response.data);
                console.log('eRIC Workbench Backend Version ' + response.data);
            }
        );

        return {
            getBackendVersion: function () {
                return backendVersion.promise
            }
        };
    })
})();
