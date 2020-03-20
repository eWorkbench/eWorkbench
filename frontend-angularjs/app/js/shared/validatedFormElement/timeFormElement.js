/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('shared');

    module.directive('timeFormElement', function (
        TimeFormatService
    ) {
        return {
            restrict: 'E', // as element only
            require: 'ngModel', // add ngModel as parameter to link()
            templateUrl: "js/shared/validatedFormElement/time-form-element.html",
            scope: {
                // @ ... constant string
                // = ... two-way-binding
                // ? ... optional
                id: "@",
                placeholder: "@",
                autoFocus: "=",
                ngModel: "=",
                ngDisabled: '=',
                ngReadonly: '=?'
            },
            link: function (scope, element, attrs, ngModel) {
                // define how to display the model value
                ngModel.$formatters.push(function (internalValue) {
                    if (internalValue == null || internalValue == undefined || internalValue == '') {
                        return '';
                    }

                    return TimeFormatService.formatTime(internalValue);
                });

                // define how to parse the input data
                ngModel.$parsers.push(function (displayValue) {
                    if (displayValue == null || displayValue == undefined || displayValue == '') {
                        return null;
                    }

                    return TimeFormatService.parseTime(displayValue);
                });

                // render the display value for the model value
                ngModel.$render = function () {
                    scope.time = ngModel.$viewValue;
                };

                // parse the input (when it changes) to the model value
                scope.$watch('time', function () {
                    ngModel.$setViewValue(scope.time);
                });
            }
        };
    });

})();
