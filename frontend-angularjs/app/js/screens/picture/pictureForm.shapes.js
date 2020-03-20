/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * @ngdoc directive
     *
     * @name pictureFormShapes
     *
     * @memberOf module:screens
     *
     * @restrict E
     *
     * @description
     * Directive for displaying a picture form element with a literally canvas element in it
     */
    module.directive('pictureFormShapes', function () {
        return {
            restrict: 'E',
            controller: 'PictureFormShapesController',
            templateUrl: 'js/screens/picture/pictureForm.shapes.html',
            scope: {
                showSaveButton: '=?',
                picture: '=',
                lcApi: '=',
                shapes: '=',
                hasUnsavedChanges: '=?',
                pictureFormShapesApi: '=',
                readOnly: '<'
            },
            bindToController: true,
            controllerAs: 'vm'
        };
    });

    /**
     * Controller for pictureFormShapes directive
     */
    module.controller('PictureFormShapesController', function (
        $scope,
        $q,
        $timeout,
        PictureDownloadRestService,
        Upload,
        gettextCatalog,
        restApiUrl,
        toaster
    ) {
        var vm = this,
            literallyCanvasUpdateTimeoutMilliseconds = 250;

        this.$onInit = function () {
            /**
             * Background image url
             */
            vm.backgroundImageUrl = vm.picture.download_background_image;

            /**
             * Whether shapes are visible
             * @type {boolean}
             */
            vm.shapesVisible = true;

            /**
             * Whether the popover for the toolbar is open or not
             * @type {boolean}
             */
            vm.popoverOpened = false;

            // vm.pictureFormShapesApi must be initialized in $onInit(),
            // otherwise watchers on bindings of the element will not be notified
            vm.pictureFormShapesApi = {
                saveShapes: saveShapes,
                saveBackgroundImage: saveBackgroundImage,
                loadShapes: loadShapes
            };
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly;
        };

        /**
         * Download initial shapes.json
         */
        var loadShapes = function () {
            return PictureDownloadRestService.download(vm.picture.download_shapes).then(
                function success (response) {
                    var data = window.arrayBufferToString(response.data);

                    vm.shapes.shapes = angular.fromJson(data);
                    vm.shapes.width = vm.picture.width;
                    vm.shapes.height = vm.picture.height;
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to download shapes"));
                }
            ).then(resetUndoStack);
        };

        var resetUndoStack = function () {
            var unregisterWatcher = $scope.$watch("vm.lcApi", function () {
                if (vm.lcApi) {
                    // reset undo stack
                    vm.lcApi.undoStack = [];

                    unregisterWatcher();
                }
            });
        };

        var saveShapes = function () {
            var d = $q.defer();

            // convert the json shapes into a blob that we can upload
            var shapesBlob = new Blob(
                [angular.toJson(vm.shapes.shapes)],
                {type: 'application/json'}
            );

            shapesBlob.name = vm.picture.pk + "_shapes.json";

            addRenderedImageToDataAndUpload(d, {
                shapes_image: shapesBlob,
                width: vm.shapes.width,
                height: vm.shapes.height
            });

            return d.promise;
        };

        var saveBackgroundImage = function () {
            var deferred = $q.defer();

            Upload.urlToBlob(vm.backgroundImageUrl, "image.png").then(function (backgroundBlobFile) {
                addRenderedImageToDataAndUpload(deferred, {
                    background_image: backgroundBlobFile,
                    width: vm.picture.width,
                    height: vm.picture.height
                });
            });

            return deferred.promise;
        };

        /**
         * Waits a few ms for the canvas to update, then loads the rendered image and uploads
         * it alongside the given data.
         * @param deferred The deferred promise to use
         * @param data The data to upload
         */
        var addRenderedImageToDataAndUpload = function (deferred, data) {
            // wait a few milliseconds, because the literallyCanvas image might not be updated yet
            setTimeout(function () {
                var renderedImage = vm.lcApi.getImage();

                renderedImage.toBlob(function (renderedImageBlob) {
                    renderedImageBlob.name = vm.picture.pk + "_rendered.png";
                    data.rendered_image = renderedImageBlob;
                    upload(deferred, data);
                });
            }, literallyCanvasUpdateTimeoutMilliseconds);
        };

        /**
         * Uploads the given data.
         * @param deferred The deferred promise to use
         * @param data The data to upload
         */
        var upload = function (deferred, data) {
            Upload.upload({
                method: 'PATCH',
                url: restApiUrl + 'pictures/' + vm.picture.pk + '/',
                data: data
            }).then(function (response) {
                vm.picture.version_number = response.data.version_number;
                vm.picture.last_modified_by = response.data.last_modified_by;
                vm.picture.last_modified_at = response.data.last_modified_at;
                deferred.resolve(response.data);
            }, function (resp) {
                console.log('Error status: ' + resp.status);
                console.log(resp);
                toaster.pop(
                    'error',
                    gettextCatalog.getString("Error"),
                    gettextCatalog.getString("Failed to save picture")
                );
                deferred.reject();
            });
        };

        /**
         * Registers a watcher for the background image url
         */
        $scope.$watch("vm.backgroundImageUrl", function (newVal, oldVal) {
            if (newVal != oldVal) {
                console.log("background image has changed to " + vm.backgroundImageUrl);
                saveBackgroundImage();
            }
        });

        /**
         * Monitor resize event of the canvas
         * needs to be within a $timeout such that it causes another digest cycle for changing vm.shapes.width and
         * vm.shapes.height
         */
        $scope.$on("angular-resizable.resizing", function (event, args) {
            $timeout(function () {
                // width is false if it has not changed
                if (args.width) {
                    vm.shapes.width = args.width;
                }

                // height is false if it has not changed
                if (args.height) {
                    vm.shapes.height = args.height;
                }
            });
        });

        /**
         * Monitor resize-end event of the canvas
         * needs to be within a $timeout such that it causes another digest cycle for changing vm.shapes.width and
         * vm.shapes.height
         */
        $scope.$on("angular-resizable.resizeEnd", function (event, args) {
            $timeout(function () {
                // width is false if it has not changed
                if (args.width) {
                    vm.shapes.width = args.width;
                }

                // height is false if it has not changed
                if (args.height) {
                    vm.shapes.height = args.height;
                }
            });
        });
    });
})();
