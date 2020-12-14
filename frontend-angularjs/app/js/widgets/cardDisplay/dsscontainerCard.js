/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a dsscontainer as a card
     */
    module.directive('dsscontainerCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/dsscontainerCard.html',
            scope: {
                'dsscontainer': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'DSSContainerCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Contact Card Display
     */
    module.controller('DSSContainerCardDisplayController', function (
        IconImagesService
    ) {
        var vm = this;

        /**
         * DSSContainer Icon
         * @type {string}
         */
        vm.dsscontainerIcon = IconImagesService.mainElementIcons.drive;

        /**
         * Project Icon
         * @type {string}
         */
        vm.projectIcon = IconImagesService.mainElementIcons.project;

    });
})();
