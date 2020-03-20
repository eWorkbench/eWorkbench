/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Service for formatting and parsing time values.
     */
    module.service('TimeFormatService', function () {

        var service = {};

        /**
         * Formats a sum of minutes as 24h time string (HH:mm).
         * @param sumOfMinutes
         * @returns {string}
         */
        service.formatTime = function (sumOfMinutes) {
            var hours = Math.floor(sumOfMinutes / 60),
                minutes = sumOfMinutes % 60;

            if (minutes < 10) {
                minutes = "0" + minutes;
            }

            return hours + ':' + minutes;
        };

        /**
         * Parses the given 24h time string (HH:mm) to the sum of minutes (Number).
         * @param timeStr
         * @returns {number}
         */
        service.parseTime = function (timeStr) {
            var value = timeStr || '00:00',
                splitValue = value.split(':'),
                hours = parseInt(splitValue[0], 10),
                minutes = parseInt(splitValue[1], 10);

            if (hours > 23 || minutes > 59) {
                return null;
            }

            return (hours * 60) + minutes;
        };

        return service;
    });
})();
