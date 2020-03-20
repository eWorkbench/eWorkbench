/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('metadataDiffWidget', function () {
        return {
            restrict: 'E', // as element only
            controller: 'MetadataDiffWidgetController',
            templateUrl: 'js/widgets/metadata/diffWidget/metadataDiffWidget.html',
            scope: {
                // @ ... constant string input
                leftObjStr: '@',
                rightObjStr: '@'
            },
            controllerAs: 'vm',
            bindToController: true
        }
    });

    module.controller('MetadataDiffWidgetController', function (
        $scope,
        MetadataFieldService,
        MetadataFormatService
    ) {
        var vm = this;

        /**
         * The right object that needs to be compared with the left object
         * @type {object}
         */
        vm.rightObj = null;

        /**
         * The left object that needs to be compared with the right object
         * @type {object}
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
            vm.leftObj = angular.fromJson(vm.leftObjStr);
        });

        /**
         * convert the right object string (json) into an object
         */
        $scope.$watch("vm.rightObjStr", function (newVal, oldVal) {
            vm.rightObj = angular.fromJson(vm.rightObjStr);
        });

        /**
         * Watch left and right object, and compare them if they change
         */
        $scope.$watchGroup(["vm.rightObj", "vm.leftObj"], function () {
            // ensure that metadata fields have been loaded before rendering
            MetadataFieldService.onFieldsLoaded(function () {
                vm.renderDiffList();
            });
        });

        vm.renderDiffList = function () {
            // compare using JsDiff
            var diff = window.JsDiff.diffArrays(
                vm.leftObj, vm.rightObj, {
                    comparator: function (left, right) {
                        return right.pk === left.pk
                            && right.fields.field === left.fields.field
                            && JSON.stringify(right.fields.values) === JSON.stringify(left.fields.values);
                    }
                }
            );

            vm.diffs = [];
            for (var i = 0; i < diff.length; i++) {
                vm.renderDiff(diff[i]);
            }
        };

        vm.renderDiff = function (diffRow) {
            var viewItems = [];

            for (var j = 0; j < diffRow.count; j++) {
                if (diffRow.value[j] && diffRow.value[j].fields) {
                    var diffRowValue = diffRow.value[j],
                        fieldId = diffRowValue.fields.field,
                        field = MetadataFieldService.fieldMap[fieldId],
                        value = MetadataFormatService.formatValuesToSingleLine(diffRowValue.fields.values, field),
                        fieldName = (field) ? field.name : fieldId;

                    viewItems.push({
                        'field': fieldName,
                        'value': value
                    });
                }
            }

            if (diffRow.removed || diffRow.added) {
                vm.diffs.push({
                    'deleted': diffRow.removed,
                    'inserted': diffRow.added,
                    'items': viewItems
                });
            }
        };
    })
})();
