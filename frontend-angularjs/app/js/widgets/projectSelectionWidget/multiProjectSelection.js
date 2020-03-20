/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Provides a field where multiple projects can be selected.
     */
    module.component('multiProjectSelection', {
        templateUrl: 'js/widgets/projectSelectionWidget/multiProjectSelection.html',
        controller: 'MultiProjectSelectionController',
        controllerAs: 'vm',
        bindings: {
            'readOnly': '<?',
            'selectedProjectPks': '=',
            'error': '<?',
            'placeholder': '@?',
            'maxItems': '<?'
        }
    });

    module.controller('MultiProjectSelectionController', function (
        $scope,
        toaster,
        gettextCatalog,
        ProjectPkToDetailService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.projectsLoaded = false;
            vm.selectizeOptions = [];

            if (vm.selectedProjectPks) {
                ProjectPkToDetailService.getProjectList(vm.selectedProjectPks).then(
                    function success (projects) {
                        vm.projectsLoaded = true;
                        vm.selectizeOptions = projects;
                    },
                    function error (rejection) {
                        toaster.pop('error', gettextCatalog.getString("Failed to load project"));
                        console.log(rejection);
                    }
                );
            } else {
                vm.projectsLoaded = true;
            }
        };

    });
})();
