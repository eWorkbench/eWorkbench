/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name labbookChildElementDiffWidget
     *
     * @restrict E
     *
     * @description Compares the child elements of a labbook and renders it as a div
     */
    module.directive('labbookChildElementDiffWidget', function () {
        return {
            restrict: 'E',
            controller: 'LabbookChildElementDiffController',
            templateUrl: 'js/widgets/labbookChildElementDiffWidget/labbookChildElementDiffWidget.html',
            scope: {
                leftObjStr: '@',
                rightObjStr: '@'
            },
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for displaying a diff between two labbook child elements
     */
    module.controller('LabbookChildElementDiffController', function (
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
         */
        $scope.$watchGroup(["vm.rightObj", "vm.leftObj"], function () {
            // compare

            var diff = window.JsDiff.diffArrays(
                vm.leftObj, vm.rightObj, {
                    comparator: function (left, right) {
                        // is true when a new object was added and received from the api so the
                        // primary key was set on the new object but not on the old one.
                        // Anyway both are the same object
                        if (right.pk === left.pk && right.fields.position_x === left.fields.position_x
                            && right.fields.position_y === left.fields.position_y
                            && right.fields.width === left.fields.width
                            && right.fields.height === left.fields.height
                            && right.fields.child_object_id === left.fields.child_object_id
                            && right.fields.child_object_content_type === left.fields.child_object_content_type
                        ) {

                            return true;
                        }

                        return false;
                    }
                }
            );

            vm.diffs = [];

            for (var i = 0; i < diff.length; i++) {
                var diffRow = diff[i];

                var items = [];

                for (var j = 0; j < diffRow.count; j++) {
                    if (diffRow.value[j] && diffRow.value[j].fields) {
                        items.push(diffRow.value[j].fields);
                    }
                }

                vm.diffs.push({
                    'deleted': diffRow.removed == true,
                    'inserted': diffRow.added == true,
                    'items': items
                });
            }
        });
    });
})();
