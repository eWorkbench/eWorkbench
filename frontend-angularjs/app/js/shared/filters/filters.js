/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('shared');

    module.filter('contentTypeToModelName', function (workbenchElements, gettextCatalog) {
        return function (contentType) {
            if (contentType in workbenchElements.elements) {
                return workbenchElements.elements[contentType].translation;
            }

            return gettextCatalog.getString('Unknown content type');
        };
    });

    module.filter('contentTypeToIconClass', function (workbenchElements) {
        return function (contentType) {
            if (contentType in workbenchElements.elements) {
                return workbenchElements.elements[contentType].icon;
            }

            return 'fa fa-question-circle-o';
        };
    });

    module.filter('fullNameOrUsername', function (workbenchElements) {
        return function (created_by) {

            return created_by.userprofile.first_name && created_by.userprofile.last_name ?
                created_by.userprofile.first_name + " " + created_by.userprofile.last_name :
                created_by.username;
        };
    });

    // from https://gist.github.com/thomseddon/3511330

    module.filter('bytes', function () {
        return function (bytes, precision) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
                return '-';
            }
            if (bytes === 0) {
                return '0 bytes';
            }
            if (typeof precision === 'undefined') {
                precision = 1;
            }
            var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                number = Math.floor(Math.log(bytes) / Math.log(1024));


            return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
        }
    });
})();
