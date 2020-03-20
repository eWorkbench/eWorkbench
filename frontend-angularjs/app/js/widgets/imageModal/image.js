/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Adds a click event listener to an image element
     * On click, a modal dialog opens
     */
    module.directive('myImage', function () {
        return {
            restrict: 'E',
            scope: {
                'imageSrc': '='
            },
            templateUrl: 'js/widgets/imageModal/image.html',
            controller: 'MyImageController',
            bindToController: true,
            controllerAs: 'vm'
        };
    });


    /**
     * Controller for the `myImage` directive and the resulting modal dialog when clicking on the image
     */
    module.controller('MyImageController', function (
        $scope,
        $uibModal
    ) {
        "ngInject";

        var vm = this,
            modalInstance = null;

        vm.open = function () {
            modalInstance = $uibModal.open({
                templateUrl: 'js/widgets/imageModal/imageModal.html',
                controllerAs: 'vm',
                scope: $scope,
                size: 'lg'
            });
        };

        vm.dismiss = function () {
            modalInstance.dismiss();
        }
    });
})();
