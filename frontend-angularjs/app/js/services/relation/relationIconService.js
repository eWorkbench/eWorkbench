/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing relation icon images
     */
    module.factory('RelationIconService', function () {
        'ngInject';

        return {
            'remove': 'fa fa-link chain',
            'status': {
                'lock': 'fa fa-lock lock',
                'unlock': 'fa fa-unlock unlock'
            }
        };
    });

})();
