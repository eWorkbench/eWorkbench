/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Common user list name sorting functionality (used as sorting algorithm in UI-Grid columns).
     */
    module.service('UserListSortService', function (
        UserNameService,
        GenericSortService
    ) {
        "ngInject";

        var service = {};

        /**
         * Gets all usernames as a single string for comparing.
         * @param cellValue
         * @returns {null|*}
         */
        service.transformUserListToDisplayNamesString = function (cellValue) {
            if (cellValue && cellValue.length) {
                return cellValue.map(function (user) {
                    return UserNameService.getFullNameOrUsername(user);
                }).join(',');
            }

            return null;
        };

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
            var userNamesA = service.transformUserListToDisplayNamesString(a),
                userNamesB = service.transformUserListToDisplayNamesString(b);

            return GenericSortService.sort(userNamesA, userNamesB);
        };

        return service;
    });
})();
