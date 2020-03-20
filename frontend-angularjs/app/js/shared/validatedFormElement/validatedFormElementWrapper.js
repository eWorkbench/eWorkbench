/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('shared');

    module.directive('validatedFormElementWrapper', function () {
        return {
            restrict: 'E', // as element only
            controller: 'ValidatedFormElementWrapperController',
            transclude: true, // use html tag content
            controllerAs: 'vm',
            templateUrl: 'js/shared/validatedFormElement/validated-form-element-wrapper.html',
            scope: {
                // = ... two-way-binding
                errors: "=",
                hasFormErrors: "="
            }
        };
    });

    module.controller('ValidatedFormElementWrapperController', function (
        IconImagesService
    ) {
        'ngInject';

        var vm = this;

        vm.alertIcon = IconImagesService.mainWarningIcons.alert;
    });
})();
