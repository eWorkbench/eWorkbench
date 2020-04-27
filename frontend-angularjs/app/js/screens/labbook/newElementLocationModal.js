(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for setting location of new element modal dialog
     */
    module.service('newElementModalService', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @return {$uibModalInstance}
         */
        service.open = function (labbookChildElements, elementType, icon, labbook) {
            return $uibModal.open({
                templateUrl: 'js/screens/labbook/newElementLocationModal.html',
                controller: 'NewElementLocationModalController',
                controllerAs: 'vm',
                backdrop: 'static',
                resolve: {
                    'labbookChildElements': function () {
                        return labbookChildElements;
                    },
                    'elementType': function () {
                        return elementType;
                    },
                    'icon': function () {
                        return icon;
                    },
                    'labbook': function () {
                        return labbook;
                    }
                }
            })
        };

        return service;
    });

    /**
     * New element location Controller
     *
     * Displays the new element location form
     */
    module.controller('NewElementLocationModalController', function (
        $scope,
        $state,
        $uibModalInstance,
        LabbookChildElementsRestService,
        labbookChildElements,
        elementType,
        icon,
        labbook
    ) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            vm.labbookChildElements = labbookChildElements;
            vm.elementType = elementType;
            vm.icon = icon;
            vm.labbook = labbook;
            vm.location = 'bottom';
            vm.parent = 'labbook';

            /**
             * REST Service for Labbook Child Elements
             */
            vm.labbookChildElementRestService = LabbookChildElementsRestService(vm.labbook.pk);
        };

        /**
         * Returns true if a labbook child element is a section
         */
        vm.isLabbookSection =  function (childElement) {
            return childElement.child_object_content_type_model === 'labbooks.labbooksection';
        };

        /**
         * Handles the input from the user
         * checks if the user selected a section and queries for the sections childElements
         */
        vm.next = function () {
            var filters = {};

            if (vm.parent === 'labbook') {
                vm.close(null);
            } else {
                // we are adding a filter here: ?section=<section.pk>
                if (vm.parent && vm.parent.pk) {
                    filters['section'] =  vm.parent.child_object_id;
                }
                vm.labbookChildElementRestService.query(filters).$promise.then(
                    function success (response) {
                        vm.parent.childElements = response;
                        vm.close(vm.parent);
                    }
                )
            }
        };

        /**
         * Closes the modal dialog and returns the selected location of the new element
         */
        vm.close = function (section) {
            $uibModalInstance.close({
                location: vm.location,
                section: section
            });
        };

        /**
         * Dismiss the modal dialog
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    })
})();
