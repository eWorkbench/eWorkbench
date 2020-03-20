/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a labbook as a card
     */
    module.directive('labbookCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/labbookCard.html',
            scope: {
                'labbook': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'LabBookCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Contact Card Display
     */
    module.controller('LabBookCardDisplayController', function (
        IconImagesService
    ) {
        var vm = this;

        /**
         * LabBook Icon
         * @type {string}
         */
        vm.labbookIcon = IconImagesService.mainElementIcons.labbook;

        /**
         * Project Icon
         * @type {string}
         */
        vm.projectIcon = IconImagesService.mainElementIcons.project;
    });
})();
