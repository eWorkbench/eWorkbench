/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    module.directive('globalSearchResultItemWidget', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/globalSearchResultItem/globalSearchResultItemWidget.html',
            controller: 'GlobalSearchResultItemWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                item: '<'
            }
        }
    });

    /**
     * Controller for the Global Search - Displays a Result Item
     */
    module.controller('GlobalSearchResultItemWidgetController', function (
        $scope,
        gettextCatalog,
        IconImagesService,
        WorkbenchElementsTranslationsService
    ) {
        'ngInject';

        var
            vm = this;

        /**
         * Watch the selected item and update title, typeName and Icon
         */
        $scope.$watch("vm.item", function () {
            if (vm.item) {
                var elementName = WorkbenchElementsTranslationsService
                    .contentTypeToModelName[vm.item.content_type_model];

                vm.typeName = WorkbenchElementsTranslationsService.modelNameToTranslation[elementName];

                vm.icon = IconImagesService.mainElementIcons[elementName];

                // use the display of the item as a title
                vm.title = vm.item.display;
            } else {
                vm.title = "";
                vm.typeName = "";
                vm.icon = "";
            }
        });
    });
})();
