/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var app = angular.module('app');
    var INVALID_DATE_STR = "-";

    /**
     * Checks if a date object is valid.
     */
    function isInvalid (theDate) {
        return theDate === undefined || theDate == null;
    }

    /**
     * This file contains a global configuration for date display filters
     * See https://momentjs.com/docs/#/displaying/ for configuration options
     */


    /**
     * Displays Hour and Minute like this: 23:59
     */
    app.filter('smallHourMinute', function (apiDateConfig) {
        return function (theDate) {
            if (isInvalid(theDate)) {
                return INVALID_DATE_STR;
            }

            return moment(theDate).format('HH:mm');
        }
    });

    /**
     * Displays like this: Monday, 2016-12-31
     */
    app.filter('smallDayMonth', function (apiDateConfig) {
        return function (theDate) {
            if (isInvalid(theDate)) {
                return INVALID_DATE_STR;
            }

            return moment(theDate).format('dddd, YYYY-MM-DD');
        }
    });

    /**
     * Should have displayed Month Day Hour Minute, though ISO Date format does not allows that format
     */
    app.filter('smallDateWithoutYear', function (apiDateConfig) {
        return function (theDate) {
            if (isInvalid(theDate)) {
                return INVALID_DATE_STR;
            }

            return moment(theDate).format('YYYY-MM-DD, HH:mm');
        }
    });

    /**
     * Displays like this: 2016-12-31, 15:10
     */
    app.filter('smallDate', function (apiDateConfig) {
        return function (theDate) {
            if (isInvalid(theDate)) {
                return INVALID_DATE_STR;
            }

            return moment(theDate).format('YYYY-MM-DD, HH:mm');
        }
    });


    app.filter('smallDateWithToday', function (apiDateConfig, gettextCatalog) {
        return function (theDate) {
            if (isInvalid(theDate)) {
                return INVALID_DATE_STR;
            }

            var momentDate = moment(theDate);

            var yesterday = moment(new Date()).subtract(1, 'days').startOf('day');

            if (momentDate.isSame(new Date(), "day")) {
                return gettextCatalog.getString("Today") + ", " + momentDate.format('HH:mm');

            } else if (momentDate.isSame(yesterday, "day")) {
                return gettextCatalog.getString("Yesterday") + ", " + momentDate.format('HH:mm');
            }

            return momentDate.format('YYYY-MM-DD, HH:mm');
        }
    });


    /**
     * Displays like this: 2016-12-31
     */
    app.filter('smallDateWithoutTime', function (apiDateConfig) {
        return function (theDate) {
            if (isInvalid(theDate)) {
                return INVALID_DATE_STR;
            }

            return moment(theDate).format('YYYY-MM-DD');
        }
    });

    /**
     * Display like this: Monday, 2016-12-31, 23:59
     */
    app.filter('largeDate', function (apiDateConfig) {
        return function (theDate) {
            if (isInvalid(theDate)) {
                return INVALID_DATE_STR;
            }

            return moment(theDate).format('dddd, YYYY-MM-DD, HH:mm');
        }
    });
})();
