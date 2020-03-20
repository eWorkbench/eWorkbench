/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Generic View Button
     */
    module.directive('screenHeaderFunctionBarViewButton', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/screenHeaderFunctionBar/viewButton.html',
            controller: 'ScreenHeaderFunctionBarViewButtonController',
            scope: {
                currentView: '=',
                title: '<',
                textTitle: '@',
                viewName: '@',
                iconClass: '@'
            },
            controllerAs: 'vm',
            bindToController: true
        }
    });

    module.controller('ScreenHeaderFunctionBarViewButtonController', function (
        $scope
    ) {
        "ngInject";
        var vm = this;

        this.$onInit = function () {
            vm.updateIsActive();
            vm.iconClasses = "fa " + vm.iconClass;
        };

        $scope.$watch("vm.currentView", function (newVal, oldVal) {
            vm.updateIsActive();
        });

        vm.updateIsActive = function () {
            vm.isActive = (vm.currentView === vm.viewName);
        };

        vm.switchToView = function () {
            vm.currentView = vm.viewName;
        };
    });
})();
