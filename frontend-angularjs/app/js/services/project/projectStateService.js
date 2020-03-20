/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing project state info
     */
    module.factory('ProjectStateService', function (gettextCatalog) {
        'ngInject';

        return {
            'texts': {
                'INIT': gettextCatalog.getString("Created"),
                'START': gettextCatalog.getString("Started"),
                'FIN': gettextCatalog.getString("Finished"),
                'PAUSE': gettextCatalog.getString("Paused"),
                'CANCE': gettextCatalog.getString("Canceled")
            },
            'order': {
                'INIT': 0,
                'START': 10,
                'FIN': 20,
                'PAUSE': 30,
                'CANCE': 40,
                'DEL': 50
            },
            'icons': {
                'INIT': 'fa fa-folder-open-o',
                'START': 'fa fa-spinner',
                'FIN': 'fa fa-flag-checkered',
                'PAUSE': 'fa fa-clock-o',
                'CANCE': 'fa fa-times',
                'DEL': 'fa fa-trash-o'
            },
            'cssClasses': {
                'INIT': '',
                'START': '',
                'FIN': '',
                'PAUSE': '',
                'CANCE': '',
                'DEL': ''
            }
        }
    });

})();
