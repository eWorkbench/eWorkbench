/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('shared');

    module.service('uiRouterHelper', function (
        $injector,
        $state,
        gettextCatalog
    ) {
        var service = {};

        /**
         * get title of a specific state (with queryParams)
         * @param targetState
         * @param queryParams
         * @returns {*}
         */
        service.getTitleOfState = function (targetState, queryParams) {
            if (targetState.simpleTitle) {
                return $injector.invoke(targetState.simpleTitle, null, {
                    '$queryParams': queryParams
                });
            } else if (targetState.title) {
                return $injector.invoke(targetState.title, null, {
                    '$queryParams': queryParams
                });
            }
            // else:
            console.error("No title found for the given state");

            return gettextCatalog.getString("Unknown state");
        };

        return service;
    });
})();
