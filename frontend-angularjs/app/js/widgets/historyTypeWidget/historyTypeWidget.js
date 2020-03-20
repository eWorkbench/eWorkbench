/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * A directive which displays a history type
     */
    module.directive('historyTypeWidget', function () {
        return {
            templateUrl: 'js/widgets/historyTypeWidget/historyTypeWidget.html',
            controller: 'HistoryTypeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                history: '=?'
            }
        }
    });

    module.controller('HistoryTypeWidgetController', function (WorkbenchElementsTranslationsService) {
        'ngInject';

        var vm = this;

        vm.getModel = function () {
            // Needs to be a function to work with ng-bind and the dynamic table sorting.
            return vm.history.object_type.model;
        };

        vm.getTypeName = function () {
            // Needs to be a function to work with ng-bind and the dynamic table sorting.
            return WorkbenchElementsTranslationsService.modelNameToTranslation[vm.getModel()];
        };
    });
})();
