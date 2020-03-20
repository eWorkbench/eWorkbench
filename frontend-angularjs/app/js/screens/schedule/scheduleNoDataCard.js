/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays the information that no data is available as a card
     */
    module.directive('scheduleNoDataCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/screens/schedule/scheduleNoDataCard.html',
            scope: {
                'schedule': '='
            },
            controller: 'ScheduleNoDataCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Schedule No Data Available Card Display
     */
    module.controller('ScheduleNoDataCardDisplayController', function (
        IconImagesService
    ) {
        var vm = this;

        /**
         * No Result Icon
         * @type {string}
         */
        vm.alertIcon = IconImagesService.mainWarningIcons.alert;
    });
})();
