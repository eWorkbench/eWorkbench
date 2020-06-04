/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a appointment as a card
     */
    module.directive('meetingCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/meetingCard.html',
            scope: {
                'meeting': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'MeetingCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Appointment Card Display
     */
    module.controller('MeetingCardDisplayController', function (
        IconImagesService
    ) {
        var vm = this;

        /**
         * Appointment Icon
         * @type {string}
         */
        vm.meetingIcon = IconImagesService.mainElementIcons.meeting;

        /**
         * Project Icon
         * @type {string}
         */
        vm.projectIcon = IconImagesService.mainElementIcons.project;
    });
})();
