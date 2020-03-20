/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    module.directive("sortableColumn", function () {
        return {
            restrict: 'A',
            transclude: true,
            templateUrl: 'js/shared/sortableColumn/sortableColumn.html',
            controller: 'SortableColumnController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                sortableColumn: '@', // string
                sortBy: '=',
                sortReverse: '='
            }
        };
    });

    module.controller('SortableColumnController', function () {
        "ngInject";

        var vm = this;

        vm.toggleSearch = function () {
            if (vm.sortableColumn === vm.sortBy) {
                vm.sortReverse = !vm.sortReverse;
            } else {
                vm.sortBy = vm.sortableColumn;
                vm.sortReverse = false;
            }
        };
    });

})();