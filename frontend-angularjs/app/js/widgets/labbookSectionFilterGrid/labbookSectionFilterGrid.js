/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Scope stack view for labbook section filter grid.
     */
    module.component('labbookSectionFilterGrid', {
        templateUrl: 'js/widgets/labbookSectionFilterGrid/labbookSectionFilterGrid.html',
        controller: 'labbookSectionFilterGridController',
        controllerAs: 'vm',
        bindings: {
            'sectionElements': '=',
            'labbook': '<',
            'skipNextWebsocketRefresh': '<'
        }
    });

    module.controller('labbookSectionFilterGridController', function (
        $scope,
        LabbookGridOptions
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * Options for angular gridster
             **/
            vm.sectionFilterGridsterOpts = LabbookGridOptions.getCommonGridsterOpts();
            vm.sectionFilterGridsterOpts.pushing = false;
            vm.sectionFilterGridsterOpts.floating = true;
            vm.sectionFilterGridsterOpts.swapping = false;
            vm.sectionFilterGridsterOpts.defaultSizeX = 20;
            vm.sectionFilterGridsterOpts.defaultSizeY = 1;
        };

        vm.prepareElements = function () {
            vm.sectionFilterChildElementsLoaded = false;
            // needs to be reset
            vm.sectionFilterChildElements = [];
            // need to copy here in order to avoid the "real" vm.childElements to change position_y
            vm.sectionFilterChildElements = angular.copy(vm.sectionElements);
            for (var i = 0; i < vm.sectionFilterChildElements.length; i++) {
                vm.sectionFilterChildElements[i].position_y = 0;
            }
            vm.sectionFilterChildElementsLoaded = true;
        };

        $scope.$watch("vm.sectionElements", function () {
            vm.prepareElements();
        });
    });
})();
