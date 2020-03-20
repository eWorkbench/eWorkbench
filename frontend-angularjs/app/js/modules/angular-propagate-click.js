/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('anxPropagateClick', []);

    /**
     * @ngdoc directive
     *
     * @name ngPropagateClickTo
     *
     * @restrict A
     *
     * @description
     * A simple AngularJS directive which propagates a click from one DOM element to another DOM element
     *
     * @param {String} ngPropagateClickTo class name of the element to propagate the event to
     */
    module.directive('ngPropagateClickTo', function () {
        return {
            'restrict': 'A',
            link: function (scope, element, attr) {

                var onClick = function (e) {
                    var targetElement = jQuery(element[0].getElementsByClassName(attr.ngPropagateClickTo));

                    targetElement.focus();

                    e.preventDefault();
                };

                element.on('click', onClick);

                scope.$on("$destroy", function () {
                    // deregister onclick
                    element.off('click', onClick);

                });
            }
        }
    });
})();
