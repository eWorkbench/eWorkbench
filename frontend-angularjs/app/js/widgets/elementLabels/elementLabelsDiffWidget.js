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
     * @restrict E
     *
     * @description widget for showing the diff between two labels
     */
    module.directive('elementLabelsDiffWidget', function () {
        return {
            restrict: 'E',
            controller: 'ElementLabelsDiffWidgetController',
            templateUrl: 'js/widgets/elementLabels/elementLabelsDiffWidget.html',
            scope: {
                leftObjStr: '@',
                rightObjStr: '@'
            },
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for elementLabelsDiffWidget
     */
    module.controller('ElementLabelsDiffWidgetController', function (
        $scope
    ) {
        "ngInject";

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

        vm.itemsAdded = [];

        vm.itemsRemoved = [];

        /**
         * convert the left object string (json) into an object
         */
        $scope.$watch("vm.leftObjStr", function (newVal, oldVal) {
            // parse json
            vm.leftObj = newVal.split(",");
        });

        /**
         * convert the right object string (json) into an object
         */
        $scope.$watch("vm.rightObjStr", function (newVal, oldVal) {
            // parse json
            vm.rightObj = newVal.split(",");
        });

        /**
         * Watch left and right object, and compare them if they change
         */
        $scope.$watchGroup(["vm.rightObj", "vm.leftObj"], function () {
            // compare

            var diff = window.JsDiff.diffArrays(
                vm.leftObj, vm.rightObj
            );

            vm.itemsAdded = [];
            vm.itemsRemoved = [];


            for (var i = 0; i < diff.length; i++) {
                var diffRow = diff[i];

                for (var j = 0; j < diffRow.count; j++) {
                    if (diffRow.value[j]) {
                        if (diffRow.removed) {
                            vm.itemsRemoved.push(diffRow.value[j]);
                        }
                        if (diffRow.added) {
                            vm.itemsAdded.push(diffRow.value[j]);
                        }
                    }
                }
            }
        });
    });
})();
