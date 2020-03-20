/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a resource as a card
     */
    module.directive('resourceCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/resourceCard.html',
            scope: {
                'resource': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'ResourceCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Resource Card Display
     */
    module.controller('ResourceCardDisplayController', function (
        IconImagesService,
        ResourceConverterService
    ) {
        var vm = this;

        this.$onInit = function () {
            vm.resourceIcon = IconImagesService.mainElementIcons.resource;
            vm.projectIcon = IconImagesService.mainElementIcons.project;
            vm.resourceTypeIcon = ResourceConverterService.resourceTypeImages[vm.resource.type];
            vm.resourceType = ResourceConverterService.resourceTypeTexts[vm.resource.type];
        }
    });
})();
