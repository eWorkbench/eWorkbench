/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('services');

    /**
     * Service for providing dmp converter
     */
    module.factory('DmpConverterService', function (PaginationCountHeader) {
        'ngInject';

        var service = {};

        service.transformResponseForDmpArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    service.convertDmpFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    service.convertDmpFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };

        service.transformResponseForDmp = function (data, headersGetter) {
            var dmp = angular.fromJson(data);

            return service.convertDmpFromRestAPI(dmp);
        };
        /**
         *
         * @param dmp
         * @returns {*}
         */
        service.convertDmpFromRestAPI = function (dmp) {
            // do not convert objects that do not contain an actual dmp
            // this is the case when rest api throws an error
            if (!dmp.pk) {
                return dmp;
            }


            return dmp;
        };

        return service;
    });
})();
