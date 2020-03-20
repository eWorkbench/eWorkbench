/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing DMP State Info
     */
    module.factory('DmpStateService', function (gettextCatalog) {
        'ngInject';

        return {
            'dmpStates': {
                'NEW' : gettextCatalog.getString("new"),
                'PROG' : gettextCatalog.getString("in progress"),
                'FIN' : gettextCatalog.getString("completed")
            },
            'finalizedStatus': 'FIN'
        }
    });

})();