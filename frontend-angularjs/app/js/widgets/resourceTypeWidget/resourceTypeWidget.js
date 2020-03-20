/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * A directive which displays a resource type
     */
    module.directive('resourceTypeWidget', function () {
        return {
            templateUrl: 'js/widgets/resourceTypeWidget/resourceTypeWidget.html',
            controller: 'ResourceTypeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                resourceType: '='
            }
        }
    });

    module.controller('ResourceTypeWidgetController', function (ResourceConverterService) {
        'ngInject';

        var vm = this;

        vm.getResourceTypeName = function () {
            // Needs to be a function to work with ng-bind and the dynamic table sorting.
            return ResourceConverterService.resourceTypeTexts[vm.resourceType];
        };
    });
})();
