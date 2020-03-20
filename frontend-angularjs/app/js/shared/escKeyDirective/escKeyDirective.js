/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    /**
     * Angular directive that listens on pressing the escape key
     */
    module.directive('escKey', function () {
        return function (scope, element, attrs) {
            element.bind('keydown keypress', function (event) {
                if (event.which === 27) { // 27 = esc key
                    scope.$apply(function () {
                        scope.$eval(attrs.escKey);
                    });

                    event.preventDefault();
                }
            });
        };
    });
})();