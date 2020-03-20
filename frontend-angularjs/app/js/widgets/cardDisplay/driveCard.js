/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a drive as a card
     */
    module.directive('driveCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/driveCard.html',
            scope: {
                'drive': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'DriveCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Contact Card Display
     */
    module.controller('DriveCardDisplayController', function (
        IconImagesService
    ) {
        var vm = this;

        /**
         * Drive Icon
         * @type {string}
         */
        vm.driveIcon = IconImagesService.mainElementIcons.drive;

        /**
         * directory icon
         * @type {string}
         */
        vm.directoryIcon = IconImagesService.genericIcons.directory;

        /**
         * Project Icon
         * @type {string}
         */
        vm.projectIcon = IconImagesService.mainElementIcons.project;

    });
})();
