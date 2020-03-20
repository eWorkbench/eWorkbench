/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.service('pictureViewModalService', function (
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         */
        service.open = function (picture) {
            return $uibModal.open({
                templateUrl: 'js/screens/picture/pictureViewModal.html',
                controller: 'PictureViewModalController',
                controllerAs: 'vm',
                size: 'lg',
                windowClass: 'pictureViewModal',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    picture: function () {
                        return picture;
                    }
                }
            });
        };

        return service;
    });

    module.controller('PictureViewModalController', function (
        $scope,
        $uibModalInstance,
        PermissionService,
        picture
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * The literally canvas api (set by the directive)
             * @type {}
             */
            vm.lcApi = null;

            /**
             * API for saving Picture cells
             * @type {null}
             */
            vm.pictureFormShapesApi = null;

            /**
             * The shapes of the picture
             * @type {{}}
             */
            vm.shapes = {
                shapes: null,
                width: null,
                height: null
            };

            /**
             * Whether or not there are unsaved changes on the canvas element
             * @type {boolean}
             */
            vm.canvasEditButtonVisible = false;

            /**
             * the picture that is being edited
             * @type {picture|*}
             */
            vm.picture = picture;
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return !PermissionService.has('object.edit', vm.picture);
        };

        /**
         * reset errors
         */
        vm.resetErrors = function () {
            vm.errors = {};
        };

        /**
         * Uploads the shape and the rendered image of the picture
         */
        vm.saveShapes = function () {
            return vm.pictureFormShapesApi.saveShapes();
        };

        /**
         * Wait for picture form shapes api to be initialized, so we can reset the canvasEditButtonVisible
         */
        var waitForApiListener = $scope.$watch("vm.pictureFormShapesApi", function (newVal, oldVal) {
            if (newVal != oldVal) {
                vm.pictureFormShapesApi.loadShapes().then(
                    function () {
                        // reset unsaved changes
                        vm.canvasEditButtonVisible = false;
                    }
                );

                // unregister watcher
                waitForApiListener();
            }
        });

        vm.saveAndClose = function () {
            vm.saveShapes().then(vm.close);
        };

        vm.close = function (picture) {
            if (!picture || typeof picture === "undefined") {
                picture = vm.picture;
            }

            $uibModalInstance.close({
                picture: picture
            });
        }
    });
})();
