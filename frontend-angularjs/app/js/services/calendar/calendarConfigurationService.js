/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for the bootstrap-datepicker.
     */
    module.factory('CalendarConfigurationService', function (gettextCatalog) {
        'ngInject';

        /**
         * Default Options for the calendar
         * @type {{locale: string, format: string, useCurrent: boolean}}
         */
        var defaultOptions = {
                'locale': 'en-gb', // ToDo: Make this a configuration option for the app, also depending on translations
                'format': 'YYYY-MM-DD, HH:mm',
                'icons': {
                    // today icon with text
                    today:'fake-icon-today ' + gettextCatalog.getCurrentLanguage()
                },
                useCurrent: false
            },

            /**
             * configuraton for date formats
             * @type {{shortFormat: string, shortFormatWithHour: string}}
             */
            dateFormats = {
                'shortFormat': 'YYYY-MM-DD',
                'shortFormatWithHour': 'YYYY-MM-DD, HH:mm'
            },

            /**
             * Gets the configuration object for bootstrap-datepicker enriched with the default configuration options.
             *
             * @param options
             * @returns {*|{}}
             */
            getOptions = function (options) {
                options = options || {};

                for (var defaultOption in defaultOptions) {
                    if (defaultOptions.hasOwnProperty(defaultOption) && !options.hasOwnProperty(defaultOption)) {
                        options[defaultOption] = defaultOptions[defaultOption];
                    }
                }

                return options;
            };

        return {
            'getOptions': getOptions,
            'dateFormats': dateFormats,
            'defaultOptions': defaultOptions
        }
    });

})();
