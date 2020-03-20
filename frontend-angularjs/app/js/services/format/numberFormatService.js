/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Adds thousands separators to a value without decimal places.
     */
    function addThousandsSeparators (nonDecimalValueStr, separator) {
        var digitCount = 1,
            final = '';

        // go from right to left (starting after the decimal-comma)
        // and insert a thousands-separator after every 3rd digit
        for (var i = nonDecimalValueStr.length - 1; i >= 0; i--) {
            if (digitCount > 3 && digitCount % 3 === 1) {
                final = separator + final;
            }
            final = nonDecimalValueStr[i] + final;
            digitCount++;
        }

        return final;
    }

    /**
     * Checks if the given value is a defined number.
     * @param value
     * @returns {boolean}
     */
    function isDefinedNumber (value) {
        return Boolean(value) || value === 0;
    }

    /**
     * Service for formatting and parsing numbers.
     */
    module.service('NumberFormatService', function () {
        var service = {
                locale: 'en' // TODO: use browser language at some point
            },
            separatorsForLocaleMap = {
                'en': {
                    thousands: ',',
                    decimals: '.'
                },
                'de': {
                    thousands: '.',
                    decimals: ','
                }
            };

        /**
         * Gets the thousands separator for the current locale.
         * @returns {*}
         */
        var getThousandsSeparator = function () {
            return separatorsForLocaleMap[service.locale].thousands;
        };

        /**
         * Gets the decimal separator for the current locale.
         * @returns {*}
         */
        var getDecimalSeparator = function () {
            return separatorsForLocaleMap[service.locale].decimals;
        };

        /**
         * Internet Explorer does not support Math.trunc, so here is our own.
         */
        var truncateNumber = function (number) {
            return (number >= 0) ? Math.floor(number) : Math.ceil(number);
        };

        /**
         * Returns the formatted number as string.
         * @param number
         * @param options
         * @param options.insertThousandsSeparator
         * @param options.showDecimals
         * @param options.prefix
         * @param options.suffix
         * @returns {string}
         */
        service.formatNumber = function (number, options) {
            if (!number && number !== 0) {
                return '';
            }

            var nonDecimalValue = truncateNumber(number);
            var nonDecimalValueStr = String(nonDecimalValue);
            var numberIsNegative = false;

            // check if the number is negative, only use the string without the "-" and set a flag for later
            if (number < 0) {
                nonDecimalValueStr = nonDecimalValueStr.substr(1);
                numberIsNegative = true;
            }

            // add back the "0" for negative zero numbers
            if (!nonDecimalValueStr) {
                nonDecimalValueStr = "0";
            }

            var numberStr = String(number),
                decimalSeparatorIndex = numberStr.indexOf(getDecimalSeparator()),
                hasDecimals = decimalSeparatorIndex >= 0,
                decimalValueStr = (hasDecimals) ? numberStr.substr(decimalSeparatorIndex + 1) : '0';

            if (options.insertThousandsSeparator) {
                nonDecimalValueStr = addThousandsSeparators(nonDecimalValueStr, getThousandsSeparator());
            }

            var formattedValue = (options.showDecimals && parseInt(decimalValueStr, 10) > 0)
                ? nonDecimalValueStr + getDecimalSeparator() + decimalValueStr
                : nonDecimalValueStr;

            // add back the "-" for negative numbers
            if (numberIsNegative) {
                formattedValue = "-" + formattedValue;
            }

            if (options.prefix) {
                formattedValue = options.prefix + ' ' + formattedValue;
            }
            if (options.suffix) {
                formattedValue = formattedValue + ' ' + options.suffix;
            }

            return formattedValue;
        };

        /**
         * Parses the number string to a float or integer.
         * @param numberStr
         * @param options
         * @param options.maxDecimalPlaces
         * @param options.prefix
         * @param options.suffix
         * @returns {*|number}
         */
        service.parseNumber = function (numberStr, options) {
            if (!numberStr && numberStr !== 0) {
                return null;
            }

            // remove formatting characters
            numberStr = numberStr.split(' ').join('');
            numberStr = numberStr.split(getThousandsSeparator()).join('');
            if (options.prefix && numberStr.startsWith(options.prefix)) {
                numberStr = numberStr.substr(options.prefix.length);
            }
            if (options.suffix && numberStr.endsWith(options.suffix)) {
                numberStr = numberStr.substr(0, numberStr.length - options.suffix.length);
            }

            var commaIndex = numberStr.indexOf(getDecimalSeparator()),
                hasDecimalValue = commaIndex >= 0;

            if (commaIndex < 0) {
                commaIndex = numberStr.length;
            }

            // limit decimal places
            if (hasDecimalValue && isDefinedNumber(options.maxDecimalPlaces)) {
                var maxDecimalPlaces = parseInt(options.maxDecimalPlaces, 10),
                    limitRight = Math.min(numberStr.length, commaIndex + 1 + maxDecimalPlaces);

                numberStr = numberStr.substr(0, limitRight);
            }

            return parseFloat(numberStr);
        };

        return service;
    });
})();
