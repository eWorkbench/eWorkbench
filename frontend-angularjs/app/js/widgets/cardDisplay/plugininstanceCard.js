/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a plugininstance as a card
     */
    module.directive('plugininstanceCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/plugininstanceCard.html',
            scope: {
                'plugininstance': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'PlugininstanceCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Contact Card Display
     */
    module.controller('PlugininstanceCardDisplayController', function (
        IconImagesService
    ) {
        var vm = this;

        /**
         * Plugininstance Icon
         * @type {string}
         */
        vm.pluginIcon = IconImagesService.mainElementIcons.plugin;

        /**
         * Project Icon
         * @type {string}
         */
        vm.projectIcon = IconImagesService.mainElementIcons.project;

    });
})();
