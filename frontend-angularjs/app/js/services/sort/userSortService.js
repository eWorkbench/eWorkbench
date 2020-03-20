/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Common user name sorting functionality (used as sorting algorithm in UI-Grid columns).
     */
    module.service('UserSortService', function (
        UserNameService,
        GenericSortService
    ) {
        "ngInject";

        var service = {};

        /**
         * Sort algorithm to be used with UI-Grid columns.
         * @param a
         * @param b
         * @param rowA
         * @param rowB
         * @param direction
         * @returns {number}
         */
        service.sortAlgorithm = function (a, b, rowA, rowB, direction) {
            var nameA = UserNameService.getFullNameOrUsername(a),
                nameB = UserNameService.getFullNameOrUsername(b);

            return GenericSortService.sort(nameA, nameB);
        };

        return service;
    });
})();
