/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Common sorting functionality
     */
    module.service('GenericSortService', function () {
        "ngInject";

        var service = {};

        /**
         * Generic sorting functionality.
         * @param a
         * @param b
         */
        service.sort = function (a, b) {
            // handle null values (can't compare null via < > operators)
            if (!a && !b) {
                return 0;
            } else if (a && !b) {
                return -1;
            } else if (!a && b) {
                return 1;
            }

            // compare actual values
            if (a > b) {
                return 1;
            } else if (a < b) {
                return -1
            }

            return 0;
        };

        return service;
    });
})();
