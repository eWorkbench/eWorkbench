/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing task type info
     */
    module.factory('PaginationConverterService', function (PaginationCountHeader) {
        'ngInject';

        var service = {
            'transformResponseForArray': function (data, headers) {
                var list = angular.fromJson(data);

                headers()[PaginationCountHeader.getHeaderName()] = list.count;

                return list.results;
            }
        };

        return service;
    });

})();
