/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Searches generic objects, based on the given searchResource.
     * Returns recently modified objects if the search string is empty.
     */
    module.factory('GenericSearchService', function () {
        'ngInject';

        var service = {};

        service.search = function (searchResource, searchString, recentlyModifiedDayRange) {
            service.searchResource = searchResource;
            service.recentlyModifiedDayRange =
                (recentlyModifiedDayRange === undefined || recentlyModifiedDayRange == null)
                    ? 7
                    : recentlyModifiedDayRange;

            var filters = getFilters(searchString);

            return service.searchResource(filters);
        };

        var getFilters = function (searchString) {
            var filters = {};

            // when no searchString is defined - get all elements which are modified the last
            // 'vm.elementsModifiedDayRange' days with this user
            if (searchString.length === 0) {
                filters['recently_modified_by_me'] = service.recentlyModifiedDayRange;
            } else {
                filters['search'] = searchString;
            }

            return filters;
        };

        return service;
    });

})();
