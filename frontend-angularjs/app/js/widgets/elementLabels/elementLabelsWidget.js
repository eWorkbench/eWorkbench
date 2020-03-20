/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('elementLabelsWidget', function () {
        "ngInject";

        return {
            templateUrl: 'js/widgets/elementLabels/elementLabelsWidget.html',
            restrict: 'E',
            bindToController: true,
            controllerAs: 'vm',
            controller: "ElementLabelsWidgetController",
            scope: {
                selectedLabels: '=',
                ngReadonly: '=?'
            }
        };
    });

    module.controller("ElementLabelsWidgetController", function (
        ElementLabelRestService,
        elementLabelCreateEditModalService
    ) {
        "ngInject";
        var vm = this;

        /**
         * list of labels
         * @type {Array}
         */
        vm.labels = [];

        // get all labels
        ElementLabelRestService.queryCached().$promise.then(
            function success (response) {
                vm.labels = response;
            }
        );

        vm.editLabel = function (label) {
            var modalInstance = elementLabelCreateEditModalService.openEdit(label);

            modalInstance.result.then(
                function added (label) {
                    //vm.labels.push(label);
                    //vm.selectedLabels.push(label.pk);
                },
                function dismissed () {

                }
            );
        };

        vm.addLabel = function () {
            var modalInstance = elementLabelCreateEditModalService.openCreate();

            modalInstance.result.then(
                function added (label) {
                    vm.selectedLabels.push(label.pk);
                },
                function dismissed () {

                }
            );
        };

        /**
         * Removes label from this element
         * @param label
         */
        vm.removeLabel = function (label) {
            var idx = vm.selectedLabels.indexOf(label.pk);

            if (idx >= 0) {
                vm.selectedLabels.splice(idx, 1);
            }
        };

        vm.showOnlySelectedLabels = function (label) {
            if (!vm.selectedLabels) {
                return false;
            }

            var idx = vm.selectedLabels.indexOf(label.pk);

            if (idx >= 0) {
                return true;
            }

            return false;
        };
    });
})();
