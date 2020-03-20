/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name generic-link
     *
     * @restrict E
     *
     * @description
     * Displays a link to a generic object based on its type
     *
     * @param {object} object the object that needs to be displayed
     * @param {object} type type of the object that needs to be displayed
     */
    module.directive('genericLink', function () {
        return {
            restrict: 'E',
            controller: 'GenericLinkController',
            templateUrl: 'js/widgets/link/genericLink.html',
            scope: {
                type: '=',
                object: '='
            },
            bindToController: true,
            controllerAs: 'vm'
        }
    });

    module.controller('GenericLinkController', function (
        $injector,
        $scope,
        $state,
        GenericModelService
    ) {
        "ngInject";

        var
            vm = this;

        /**
         * Watch the object and create the link if the object has changed
         */
        $scope.$watch("vm.object", function () {
            if (vm.object) {
                // inject the modal service
                try {
                    var modalService = GenericModelService.getCreateModalServiceByModelName(vm.type);

                    vm.href = modalService.getViewUrl(vm.object);
                } catch (e) {
                    // modal service not found, we can not create a url
                    vm.href = "";
                }

                vm.display = vm.object.display;
            } else {
                vm.href = "";
                vm.display = "";
            }
        });

        /**
         * Generate hyperlink for a given view and data object
         * @param view
         * @param data
         */
        vm.href = function (view, data) {
            return $state.href(view, data);
        };
    });
})();
