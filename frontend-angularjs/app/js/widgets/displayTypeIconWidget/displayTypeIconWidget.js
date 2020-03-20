/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * A directive which displays a type icon with its respective title
     */
    module.directive('displayTypeIconWidget', function () {
        return {
            templateUrl: 'js/widgets/displayTypeIconWidget/displayTypeIconWidget.html',
            controller: 'DisplayTypeIconWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                type: '='
            }
        }
    });

    module.controller('DisplayTypeIconWidgetController', function (
        $scope,
        HistoryModelTypeService,
        IconImagesService,
        WorkbenchElementsTranslationsService,
        workbenchElements
    ) {
        'ngInject';

        var
            vm = this;

        vm.icon = "";
        vm.title = "";


        /**
         * watch vm.type and adapt icon and title
         */
        $scope.$watch("vm.type", function () {
            vm.icon = IconImagesService.mainElementIcons[vm.type];

            var contentType = WorkbenchElementsTranslationsService.modelNameToContentType[vm.type];

            if (contentType) {
                vm.title = workbenchElements.elements[contentType].translation;
            } else {
                console.warn("Could not find element for type=" + vm.type);
            }
        });
    });
})();
