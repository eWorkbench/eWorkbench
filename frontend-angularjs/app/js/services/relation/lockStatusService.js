/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing lock status texts
     */
    module.factory('LockStatusService', function (gettextCatalog) {
        'ngInject';

        return {
            'lockStatusText' : {
                true: gettextCatalog.getString('Currently private - click to make public'),
                false: gettextCatalog.getString('Currently public - click to make private')
            }
        };
    });

})();
