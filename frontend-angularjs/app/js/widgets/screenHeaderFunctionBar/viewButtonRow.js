/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * This Button is similar to the original View Button with the functionality, Just it has
     * different style settings to fit inside a ui grid table row
     */
    module.directive('screenHeaderFunctionBarViewButtonRow', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/screenHeaderFunctionBar/viewButtonRow.html',
            controller: 'ScreenHeaderFunctionBarViewButtonRowController',
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

    module.controller('ScreenHeaderFunctionBarViewButtonRowController', function (
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
