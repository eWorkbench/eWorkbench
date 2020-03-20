/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    /**
     * Register a path type for ui-router
     */
    module.config(function ($urlMatcherFactoryProvider) {
        'ngInject';

        $urlMatcherFactoryProvider.type('path', {
            encode: angular.identity,
            decode: angular.identity,
            equals: function (a, b) {
                return a.toUpperCase() === b.toUpperCase();
            },
            is: function () {
                return true;
            },
            pattern: /.*/
        });

        console.log("Register 'path' type for ui-router");
    });
})();