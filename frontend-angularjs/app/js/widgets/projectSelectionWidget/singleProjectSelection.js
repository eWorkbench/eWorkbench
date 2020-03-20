/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Provides a field where a single project can be selected.
     */
    module.component('singleProjectSelection', {
        templateUrl: 'js/widgets/projectSelectionWidget/singleProjectSelection.html',
        controller: 'SingleProjectSelectionController',
        controllerAs: 'vm',
        bindings: {
            'readOnly': '<?',
            'selectedProjectPk': '=',
            'error': '<?',
            'placeholder': '@?' // input placeholder text
        }
    });

    module.controller('SingleProjectSelectionController', function (
        $scope
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.selectedPks = vm.selectedProjectPk
                ? [vm.selectedProjectPk]
                : [];
        };

        /**
         * Selectize returns a list => map to single-choice
         */
        $scope.$watch('vm.selectedPks', function () {
            if (vm.selectedPks && vm.selectedPks.length > 0) {
                vm.selectedProjectPk = vm.selectedPks[0];
            } else {
                vm.selectedProjectPk = null;
            }
        });

    });
})();
