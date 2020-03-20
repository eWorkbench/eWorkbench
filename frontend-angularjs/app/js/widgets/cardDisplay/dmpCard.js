/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a dmp as a card
     */
    module.directive('dmpCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/dmpCard.html',
            scope: {
                'dmp': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'DMPCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Contact Card Display
     */
    module.controller('DMPCardDisplayController', function (
        IconImagesService,
        DmpStateService
    ) {
        var vm = this;

        /**
         * DMP Icon
         * @type {string}
         */
        vm.dmpIcon = IconImagesService.mainElementIcons.dmp;

        /**
         * Project Icon
         * @type {string}
         */
        vm.projectIcon = IconImagesService.mainElementIcons.project;

        /**
         * Dictionary with dmp states
         * @type {*}
         */
        vm.dmpStates = DmpStateService.dmpStates;

    });
})();
