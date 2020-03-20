/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a contact as a card
     */
    module.directive('contactCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/contactCard.html',
            scope: {
                'contact': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'ContactCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Contact Card Display
     */
    module.controller('ContactCardDisplayController', function (
        IconImagesService
    ) {
        var vm = this;

        /**
         * Contact Icon
         * @type {string}
         */
        vm.contactIcon = IconImagesService.mainElementIcons.contact;

        /**
         * Project Icon
         * @type {string}
         */
        vm.projectIcon = IconImagesService.mainElementIcons.project;

        /**
         * EMail icon
         * @type {string}
         */
        vm.emailIcon = IconImagesService.genericIcons.email;

        /**
         * Phone Icon
         * @type {string}
         */
        vm.phoneIcon = IconImagesService.genericIcons.phone;
    });
})();
