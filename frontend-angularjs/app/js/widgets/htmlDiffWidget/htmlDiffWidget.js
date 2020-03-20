/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name htmlDiffWidget
     *
     * @restrict E
     *
     * @description
     * Renders a diff of two html strings
     *
     * @param {object} leftObj the previous version of the object
     * @param {object} rightObj the new version of the object
     */
    module.directive('htmlDiffWidget', function () {
        return {
            templateUrl: 'js/widgets/htmlDiffWidget/htmlDiffWidget.html',
            controller: 'HtmlDiffWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                leftObj: '=',
                rightObj: '='
            }
        }
    });

    /**
     * Controller for htmlDiffWidget
     */
    module.controller('HtmlDiffWidgetController', function ($scope) {
        'ngInject';

        var
            vm = this;

        vm.diffs = [];

        var generateHtmlDiff = function () {
            var leftObjStr = vm.leftObj;
            var rightObjStr = vm.rightObj;

            // add p tags around left and right object, in ase they are non-html texts
            if (vm.leftObj && !vm.leftObj.startsWith("<") && !vm.leftObj.endsWith(">")) {
                leftObjStr = "<p>" + vm.leftObj + "</p>";
            }

            if (vm.rightObj && !vm.rightObj.startsWith("<") && !vm.rightObj.endsWith(">")) {
                rightObjStr = "<p>" + vm.rightObj + "</p>";
            }

            // generate dom elements using jquery
            var left = jQuery(leftObjStr),
                right = jQuery(rightObjStr);


            var diff = window.JsDiff.diffArrays(
                left, right, {
                    comparator: window.domElementEquals
                }
            );

            vm.diffs = [];

            for (var i = 0; i < diff.length; i++) {
                var diffRow = diff[i];

                var htmlString = "";

                for (var j = 0; j < diffRow.count; j++) {
                    if (diffRow.value[j].outerHTML) {
                        htmlString += diffRow.value[j].outerHTML;
                    }
                }

                vm.diffs.push({
                    'deleted': diffRow.removed == true,
                    'inserted': diffRow.added == true,
                    'html': htmlString
                });
            }
        };

        $scope.$watchGroup(["vm.leftObj", "vm.rightObj"], generateHtmlDiff);
    });
})();
