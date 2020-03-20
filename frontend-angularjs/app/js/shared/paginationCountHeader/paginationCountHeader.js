/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    module.service('PaginationCountHeader', function (
    ) {
        var service = {};

        service.getHeaderName = function () {
            return 'pagination-count';
        };

        return service;
    });
})();
