/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * for linking to note, task, appointment, file, contact, project or dmp
     */
    module.directive('mainDashboardLink', function () {
        return {
            restrict: 'E',
            controller: 'MainDashboardLinkController',
            templateUrl: 'js/screens/mainDashboard/mainDashboardLink.html',
            controllerAs: 'vm',
            scope: {
                type: '<',
                data: '<',
                isLoading: '<'
            },
            bindToController: true
        }
    });

    module.controller('MainDashboardLinkController', function () {
        "ngInject";
    });
})();
