/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('elementLabelDisplayWidget', function () {
        return {
            templateUrl: 'js/widgets/elementLabels/elementLabelDisplayWidget.html',
            restrict: 'E',
            bindToController: true,
            controllerAs: 'vm',
            controller: "ElementLabelDisplayWidgetController",
            scope: {
                elementLabel: '=?',
                elementLabelPk: '=?'
            }
        };
    });

    module.controller('ElementLabelDisplayWidgetController', function (
        $scope,
        ElementLabelRestService
    ) {
        var
            vm = this;

        this.$onInit = function () {
            /**
             * Whether or not the element label was found
             * @type {boolean}
             */
            vm.elementLabelNotFound = false;
        };

        var getRGB = function (str) {
            var match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);

            return match ? {
                red: match[1],
                green: match[2],
                blue: match[3]
            } : {};
        };

        var calculateFontColor = function (color) {
            var rgb = getRGB(color);

            var brightness = Math.sqrt(
                (0.299 * Math.pow(rgb['red'], 2)) +
                (0.587 * Math.pow(rgb['green'], 2)) +
                (0.114 * Math.pow(rgb['blue'], 2))
            );

            return (brightness < 128) ? '#FFF' : '#000';

        };

        /**
         * Update font color when elementLabel changes.
         */
        $scope.$watch("vm.elementLabel", function (newVal, oldVal) {
            if (vm.elementLabel) {
                vm.elementLabel.fontColor = calculateFontColor(vm.elementLabel.color);
            }
        });

        /**
         * Set or update elementLabel for elementLabelPk.
         */
        $scope.$watch("vm.elementLabelPk", function (newVal, oldVal) {
            if (!vm.elementLabel) {
                if (vm.elementLabelPk) {
                    vm.projectNotFound = false;

                    ElementLabelRestService.getCached({pk: vm.elementLabelPk}).$promise.then(
                        function success (response) {
                            vm.elementLabel = response;
                        },
                        function error (rejection) {
                            vm.elementLabelNotFound = true;
                            vm.elementLabel = null;
                        }
                    );
                } else if (newVal == null && oldVal !== null) {
                    vm.elementLabel = null;
                }
            }
        });

    });
})();
