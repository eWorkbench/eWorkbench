/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Convert semantic HTML tags to syntactic tags that can be rendered securely.
     * E.g. <br> becomes &lt;br&gt;
     * @param html
     */
    function defuseTags (html) {
        return html.replace('<', '&lt;').replace('>', '&gt;');
    }

    /**
     * Provides methods to format metadata.
     */
    module.service('MetadataFormatService', function (
        gettextCatalog,
        MetadataBaseTypes,
        TimeFormatService,
        NumberFormatService
    ) {
        var service = {};

        /**
         * Formats the given metadata values into a text/html representation (e.g. for the diff widget).
         * @param values Values attribute of a Metadata entity
         * @param field MetadataField entity
         * @returns {string}
         */
        service.formatValuesToSingleLine = function (values, field) {
            if (!field) {
                // return values object as string, if there is no useful field object
                // (e.g. for left over metadata where the field has been deleted)
                return JSON.stringify(values);
            }

            switch (field.base_type) {
                case MetadataBaseTypes.fraction.id:
                    return values.numerator + '/' + values.denominator;

                case MetadataBaseTypes.gps.id:
                    return 'X: ' + values.x + ', Y: ' + values.y;

                case MetadataBaseTypes.selection.id:
                    var output = "";

                    if (values.answers) {
                        for (var i = 0; i < values.answers.length; i++) {
                            var answer = values.answers[i];

                            // answer might be null or undefined for corrupt data
                            if (answer) {
                                output += "<br>";
                                output += answer['selected']
                                    ? '<input type="checkbox" checked disabled>'
                                    : '<input type="checkbox" disabled>';
                                output += '&nbsp; ';
                                output += answer['answer']
                                    ? defuseTags(answer.answer)
                                    : '';
                            }
                        }
                    }

                    if (values.single_selected) {
                        output += '<br><input type="checkbox" checked disabled>&nbsp; ';
                        output += defuseTags(values.single_selected);
                    }

                    if (values.custom_input) {
                        output += "<br>";
                        output += defuseTags(values.custom_input);
                    }

                    return output;

                case MetadataBaseTypes.time.id:
                    return TimeFormatService.formatTime(values['value']);

                case MetadataBaseTypes.percentage.id:
                    return service.formatPercentage(values['value'], field);

                case MetadataBaseTypes.whole_number.id:
                    return service.formatWholeNumber(values['value'], field);

                case MetadataBaseTypes.decimal_number.id:
                    return service.formatDecimalNumber(values['value'], field);

                case MetadataBaseTypes.currency.id:
                    return service.formatCurrency(values['value'], field);

                case MetadataBaseTypes.date.id:
                    return service.formatDate(values['value']);

                case MetadataBaseTypes.checkbox.id:
                    return service.formatBoolean(values['value']);

                default:
                    return values['value'];
            }
        };

        service.formatBoolean = function (value) {
            return gettextCatalog.getString(value ? 'Yes' : 'No');
        };

        service.formatDate = function (value) {
            return moment(value).format('YYYY-MM-DD, HH:mm');
        };

        service.formatPercentage = function (number, field) {
            var maxDecimalPlaces = field.type_settings.decimals;

            return NumberFormatService.formatNumber(number, {
                showDecimals: maxDecimalPlaces === undefined || maxDecimalPlaces > 0,
                suffix: '%'
            });
        };

        service.formatWholeNumber = function (number, field) {
            return NumberFormatService.formatNumber(number, {
                insertThousandsSeparator: field.type_settings.thousands_separator,
                showDecimals: false
            });
        };

        service.formatDecimalNumber = function (number, field) {
            return NumberFormatService.formatNumber(number, {
                insertThousandsSeparator: field.type_settings.thousands_separator,
                showDecimals: true
            });
        };

        service.formatCurrency = function (number, field) {
            return NumberFormatService.formatNumber(number, {
                insertThousandsSeparator: field.type_settings.thousands_separator,
                showDecimals: true,
                prefix: field.type_settings.symbol
            });
        };

        return service;
    });
})();
