/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Provides info about metadata base types.
     */
    module.factory('MetadataBaseTypes', function (
        gettextCatalog
    ) {
        'ngInject';

        var allOperators = ['=', '<', '<=', '>', '>='];

        return {
            'whole_number': {
                'id': 'whole_number',
                'label': gettextCatalog.getString("Integer"),
                'default_settings': {
                    'thousands_separator': true
                },
                'operators': allOperators
            },
            'decimal_number': {
                'id': 'decimal_number',
                'label': gettextCatalog.getString("Decimal number"),
                'default_settings': {
                    'thousands_separator': true,
                    'decimals': 3
                },
                'operators': allOperators
            },
            'currency': {
                'id': 'currency',
                'label': gettextCatalog.getString("Currency"),
                'default_settings': {
                    'decimals': 2,
                    'symbol': '€'
                },
                'operators': allOperators
            },
            'date': {
                'id': 'date',
                'label': gettextCatalog.getString("Date"),
                'default_settings': {},
                'operators': allOperators
            },
            'time': {
                'id': 'time',
                'label': gettextCatalog.getString("Time"),
                'default_settings': {},
                'operators': allOperators
            },
            'percentage': {
                'id': 'percentage',
                'label': gettextCatalog.getString("Percentage"),
                'default_settings': {
                    'decimals': 0
                },
                'operators': allOperators
            },
            'text': {
                'id': 'text',
                'label': gettextCatalog.getString("Text"),
                'default_settings': {},
                'operators': ['=']
            },
            'fraction': {
                'id': 'fraction',
                'label': gettextCatalog.getString("Fraction"),
                'default_settings': {},
                'operators': allOperators
            },
            'gps': {
                'id': 'gps',
                'label': gettextCatalog.getString("GPS"),
                'default_settings': {},
                'operators': ['=']
            },
            'checkbox': {
                'id': 'checkbox',
                'label': gettextCatalog.getString("Checkbox"),
                'default_settings': {},
                'operators': ['=']
            },
            'selection': {
                'id': 'selection',
                'label': gettextCatalog.getString("Selection"),
                'default_settings': {
                    'multiple_select': true,
                    'final': true,
                    'answers': []
                },
                'operators': ['=']
            }
        };
    });
})();
