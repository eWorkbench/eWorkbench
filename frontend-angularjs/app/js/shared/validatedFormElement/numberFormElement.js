/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('shared');

    module.directive('numberFormElement', function (
        NumberFormatService
    ) {
        return {
            restrict: 'E', // as element only
            require: 'ngModel', // add ngModel as parameter to link()
            templateUrl: "js/shared/validatedFormElement/number-form-element.html",
            scope: {
                // @ ... constant string
                // = ... two-way-binding
                // < ... one-way input
                // ? ... optional
                id: "@",
                placeholder: "@",
                autoFocus: "=",
                ngModel: "=",
                ngDisabled: '=',
                ngReadonly: '=?',
                displayThousandsSeparator: '<',
                maxDecimalPlaces: '<',
                prefix: '<',
                suffix: '<',
                textAlign: '@'
            },
            link: function (scope, element, attrs, ngModel) {
                // define how to display the model value
                ngModel.$formatters.push(function (internalValue) {
                    return NumberFormatService.formatNumber(internalValue, {
                        'insertThousandsSeparator': scope.displayThousandsSeparator,
                        'showDecimals': scope.maxDecimalPlaces === undefined || scope.maxDecimalPlaces > 0,
                        'prefix': scope.prefix,
                        'suffix': scope.suffix
                    });
                });

                // define how to parse the input data
                ngModel.$parsers.push(function (displayValue) {
                    return NumberFormatService.parseNumber(displayValue, {
                        'maxDecimalPlaces': scope.maxDecimalPlaces,
                        'prefix': scope.prefix,
                        'suffix': scope.suffix
                    });
                });

                // render the display value for the model value
                ngModel.$render = function () {
                    scope.inputStyle = {
                        'text-align': (scope.textAlign || 'left')
                    };
                    scope.value = ngModel.$viewValue;
                };

                // parse the input (when it changes) to the model value
                scope.$watch('value', function () {
                    ngModel.$setViewValue(scope.value);
                });
            }
        };
    });
})();
