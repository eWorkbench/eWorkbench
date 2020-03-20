/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('d3Module');

    /**
     * Angular directive for injecting the d3 module
     */
    module.factory('d3', function () {
        "ngInject";

        var
            d3 = window.d3;

        // returning our service so it can be used
        return d3;
    });
})();