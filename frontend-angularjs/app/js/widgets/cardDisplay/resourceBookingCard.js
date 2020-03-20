/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a resourcebooking as a card
     */
    module.directive('resourceBookingCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/resourceBookingCard.html',
            scope: {
                'resourcebooking': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'ResourceBookingCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Resource Card Display
     */
    module.controller('ResourceBookingCardDisplayController', function (
        IconImagesService
    ) {
        var vm = this;

        /**
         * Resource Icon
         * @type {string}
         */
        vm.resourceIcon = IconImagesService.mainElementIcons.resource;
    });
})();
