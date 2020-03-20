/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('services');

    /**
     * Service for converting ResourceBooking dates
     */
    module.factory('ResourceBookingConverterService', function (PaginationCountHeader) {
        'ngInject';

        var service = {};

        service.transformResponseForResourceBookingArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    service.convertResourceBookingFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    service.convertResourceBookingFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };

        service.transformResponseForResourceBooking = function (data, headersGetter) {
            var resourcebooking = angular.fromJson(data);

            return service.convertResourceBookingFromRestAPI(resourcebooking);
        };
        /**
         * add start and end to the resourcebooking
         *    start and end are used for the angular ui calendar
         * convert date_time_start and date_time_end
         * @param resourcebooking
         * @returns {*}
         */
        service.convertResourceBookingFromRestAPI = function (resourcebooking) {
            // do not convert objects that do not contain an actual resourcebooking
            // this is the case when rest api throws an error
            if (!resourcebooking.pk) {
                return resourcebooking;
            }

            resourcebooking.date_time_start = moment(resourcebooking.date_time_start);
            resourcebooking.date_time_end = moment(resourcebooking.date_time_end);
            resourcebooking.start = resourcebooking.date_time_start;
            resourcebooking.end = resourcebooking.date_time_end;

            return resourcebooking;
        };

        return service;
    });
})();
