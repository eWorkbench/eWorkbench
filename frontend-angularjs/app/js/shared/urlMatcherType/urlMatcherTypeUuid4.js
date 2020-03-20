/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    /**
     * Register an UUID4 type for ui-router
     */
    module.config(function ($urlMatcherFactoryProvider) {
        'ngInject';

        $urlMatcherFactoryProvider.type('uuid4', {
            encode: angular.identity,
            decode: angular.identity,
            equals: function (a, b) {
                return a.toUpperCase() === b.toUpperCase();
            },
            is: function (val) {
                var
                    guidPattern = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;


                return guidPattern.test(val);
            },
            // No anchors or flags with pattern
            pattern: /[a-fA-F\d]{8}-(?:[a-fA-F\d]{4}-){3}[a-fA-F\d]{12}/
        });

        console.log("Register 'uuid4' type for ui-router");
    });
})();