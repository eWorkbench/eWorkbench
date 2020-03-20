/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a picture as a card
     */
    module.directive('pictureCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/pictureCard.html',
            scope: {
                'picture': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'PictureCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Contact Card Display
     */
    module.controller('PictureCardDisplayController', function (
        IconImagesService
    ) {
        var vm = this;

        /**
         * Picture Icon
         * @type {string}
         */
        vm.pictureIcon = IconImagesService.mainElementIcons.picture;

        /**
         * Project Icon
         * @type {string}
         */
        vm.projectIcon = IconImagesService.mainElementIcons.project;

    });
})();
