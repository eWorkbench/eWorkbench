/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A simple directive which renders a given dsscontainer read write setting ( into an icon
     * with text
     * Uses the taskConverterService
     */
    module.directive('dsscontainerSettingsDisplayWidget', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/dsscontainerSettingsDisplay/dsscontainerSettingsDisplay.html',
            scope: {
                dssContainerRWSetting: '=?',
                dssContainerImportOption: '=?'
            },
            controller: 'DSSontainerSettingsDisplayWidgetController',
            bindToController: true,
            controllerAs: 'vm'
        };
    });

    module.controller('DSSontainerSettingsDisplayWidgetController', function (
        $scope,
        DSSContainerConverterService
    ) {
        var vm = this;

        vm.icon = "";
        vm.text = "";

        /**
         * Watch DSSContainer State and update the icon and text according to the dsscontainer state set
         */
        $scope.$watch("vm.dssContainerRWSetting", function (newVal) {
            if (newVal) {
                vm.icon = DSSContainerConverterService.dssContainerRWSettingImages[vm.dssContainerRWSetting];
                vm.text = DSSContainerConverterService.dssContainerRWSettingTexts[vm.dssContainerRWSetting];
            }
        });

        /**
         * Watch DSSContainer Priority and update the icon and text according to the dsscontainer state set
         */
        $scope.$watch("vm.dssContainerImportOption", function (newVal) {
            if (newVal) {
                vm.icon = DSSContainerConverterService.dssContainerImportOptionImages[vm.dssContainerImportOption];
                vm.text = DSSContainerConverterService.dssContainerImportOptionTexts[vm.dssContainerImportOption];
            }
        });
    });
})();
