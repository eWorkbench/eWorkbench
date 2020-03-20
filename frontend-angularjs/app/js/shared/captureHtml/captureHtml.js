/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('shared');

    /**
     * @ngdoc directive
     *
     * @name captureHtml
     *
     * @restrict E
     *
     * @description
     * Captures the transcluded HTML in the provided parameter. As the template is empty, this directive does not
     * actually render something
     *
     * @param {*} param The HTML will be written to this variable
     */
    module.directive('captureHtml', function ($compile, $parse, $injector, $sce, $timeout) {
        "ngInject";

        return {
            restrict: 'E',
            template: '',
            scope: {
                param: '='
            },
            link: function (scope, element, attrs, controller) {
                var value = element[0].innerHTML;

                // remove the element from DOM for performance reasons
                jQuery(element[0]).remove();

                // wait for the next digest cycle to set the parameter
                $timeout(function () {
                    scope.param = $sce.trustAsHtml(value);
                });
            }
        };
    })
})();
