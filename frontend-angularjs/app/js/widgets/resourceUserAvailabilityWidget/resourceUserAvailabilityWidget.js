/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * A directive which displays a resource user availability
     */
    module.directive('resourceUserAvailabilityWidget', function () {
        return {
            templateUrl: 'js/widgets/resourceUserAvailabilityWidget/resourceUserAvailabilityWidget.html',
            controller: 'ResourceUserAvailabilityWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                resourceUserAvailability: '='
            }
        }
    });

    module.controller('ResourceUserAvailabilityWidgetController', function (ResourceConverterService) {
        'ngInject';

        var vm = this;

        vm.getAvailabilityText = function () {
            // Needs to be a function to work with ng-bind and the dynamic table sorting.
            return ResourceConverterService.resourceUserAvailabilityTexts[vm.resourceUserAvailability];
        };
    });
})();
