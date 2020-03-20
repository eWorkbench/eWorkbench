/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.directive('dmpFormDataDiffWidget', function () {
        return {
            restrict: 'E',
            controller: 'DmpFormDataDiffWidgetController',
            templateUrl: 'js/widgets/dmpFormDataDiffWidget/dmpFormDataDiffWidget.html',
            scope: {
                leftObjStr: '@',
                rightObjStr: '@'
            },
            controllerAs: 'vm',
            bindToController: true
        };
    });

    module.controller('DmpFormDataDiffWidgetController', function (
        $scope
    ) {
        var vm = this;

        /**
         * The right object that needs to be compared with the left object
         * @type {}
         */
        vm.rightObj = null;

        /**
         * The left object that needs to be compared with the right object
         * @type {null}
         */
        vm.leftObj = null;

        /**
         * Differences between the left and the right object
         * @type {Array}
         */
        vm.diffs = [];

        /**
         * convert the left object string (json) into an object
         */
        $scope.$watch("vm.leftObjStr", function (newVal, oldVal) {
            // parse json
            vm.leftObj = angular.fromJson(vm.leftObjStr);
        });

        /**
         * convert the right object string (json) into an object
         */
        $scope.$watch("vm.rightObjStr", function (newVal, oldVal) {
            // parse json
            vm.rightObj = angular.fromJson(vm.rightObjStr);
        });

        /**
         * Watch left and right object, and compare them if they change
         * For each changed value of the DMP, we compare them using HTMLDOMCompare
         */
        $scope.$watchGroup(["vm.rightObj", "vm.leftObj"], function () {
            // compare
            vm.diffs = [];

            var i = 0,
                j = 0;

            // check if the length of left and right obj are the same
            if (vm.leftObj.length == vm.rightObj.length) {
                // they are, we can now do our HTML compare for each DMP Form Data value
                for (i = 0; i < vm.leftObj.length; i++) {
                    if (vm.leftObj[i].fields.value != vm.rightObj[i].fields.value) {
                        var leftObjStr = vm.leftObj[i].fields.value;
                        var rightObjStr = vm.rightObj[i].fields.value;

                        if (leftObjStr.startsWith("<") && !leftObjStr.endsWith(">")) {
                            leftObjStr = "<p>" + leftObjStr + "</p>";
                        }

                        if (rightObjStr.startsWith("<") && !rightObjStr.endsWith(">")) {
                            rightObjStr = "<p>" + rightObjStr + "</p>";
                        }

                        // generate dom elements using jquery
                        var left = jQuery(leftObjStr),
                            right = jQuery(rightObjStr);

                        var diff = window.JsDiff.diffArrays(
                            left, right, {
                                comparator: window.domElementEquals
                            }
                        );

                        // generate diff for the current dmp form data value
                        var innerDiffs = [];

                        for (j = 0; j < diff.length; j++) {
                            var diffRow = diff[j];

                            var htmlString = "";

                            for (var k = 0; k < diffRow.count; k++) {
                                if (diffRow.value[k].outerHTML) {
                                    htmlString += diffRow.value[k].outerHTML;
                                }
                            }

                            innerDiffs.push({
                                'deleted': diffRow.removed == true,
                                'inserted': diffRow.added == true,
                                'html': htmlString
                            });
                        }

                        vm.diffs.push({
                            'name': vm.rightObj[i].fields.name,
                            'innerDiffs': innerDiffs
                        })
                    }
                }
            } else {
                // probably just created, so all elements are added to the diff
                for (i = 0; i < vm.rightObj.length; i++) {
                    // add an item to innerDiffs, stating that this is neither an insert nor deleted
                    vm.diffs.push({
                        'name': vm.rightObj[i].fields.name,
                        'innerDiffs': [
                            {
                                'deleted': false,
                                'inserted': false,
                                'html': vm.rightObj[i].fields.value
                            }
                        ]
                    });
                }
            }
        });
    });
})();
