/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('shared');

    /**
     * Wraps the inner element with a prefix and/or suffix, without changing the overall width.
     */
    module.directive('affixedElement', function () {
        return {
            restrict: 'E', // as element only
            transclude: true, // use html tag content
            templateUrl: 'js/shared/validatedFormElement/affixed-element.html',
            scope: {
                // @ ... constant string
                prefix: "<",
                suffix: "<"
            }
        };
    });

})();
