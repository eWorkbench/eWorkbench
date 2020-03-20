/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Removes the first occurrence of an element from an array, if it is contained.
     * @param needle
     * @param haystack
     */
    function removeFromArray (needle, haystack) {
        var index = haystack.indexOf(needle);

        if (index >= 0) {
            haystack.splice(index, 1);
        }
    }

    module.directive('resourceCheckboxListWidget', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/resourceCheckboxListWidget/resourceCheckboxListWidget.html',
            controller: 'ResourceCheckboxListWidgetController',
            scope: {
                resources: '=',
                selectedResources: '='
            },
            controllerAs: 'vm',
            bindToController: true
        }
    });

    module.controller('ResourceCheckboxListWidgetController', function (
        $scope,
        $rootScope
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.isResourceSelectedMap = [];
            vm.selectedResource = [];
        };

        vm.removeResource = function (resource) {
            $rootScope.$emit("resource-removed-from-selection", {resource_pk: resource.pk});
            vm.resources.push(resource);
            removeFromArray(resource, vm.selectedResources);
            removeFromArray(resource.pk, vm.isResourceSelectedMap);
        };



        /**
         * Any the the vm.resources collection changes:
         * 1.) Add resource display name
         * 2.) Update vm.selectedResource for new resources
         */
        $scope.$watchCollection('vm.selectedResources', function (newValue, oldValue) {
            var resource = null;

            for (var i = 0; i < vm.selectedResources.length; i++) {
                resource = vm.selectedResources[i];

                vm.isResourceSelectedMap[resource.pk] = true;
                removeFromArray(resource, vm.resources);

            }
        });
    });
})();
