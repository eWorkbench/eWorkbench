/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for creating a picture-create modal dialog
     */
    module.service('pictureCreateModalService', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @returns {$uibModalInstance}
         */
        service.open = function (template) {
            return $uibModal.open({
                templateUrl: 'js/screens/picture/pictureCreateModal.html',
                controller: 'PictureCreateModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    'template': function () {
                        return template;
                    }
                }
            });
        };

        /**
         * View the supplied element
         * @param picture
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (picture, options) {
            return $state.go("picture-view", {picture: picture}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param picture
         * @returns {string} the url
         */
        service.getViewUrl = function (picture) {
            return $state.href("picture-view", {picture: picture});
        };

        return service;
    });

    /**
     * Picture Create Controller
     *
     * Displays the picture create form
     */
    module.controller('PictureCreateModalController', function (
        $scope,
        $http,
        $q,
        $state,
        $timeout,
        $uibModalInstance,
        confirmDialogWidget,
        FileSaver,
        GlobalErrorHandlerService,
        PictureRestService,
        ProjectSidebarService,
        toaster,
        gettextCatalog,
        IconImagesService,
        pdfPreviewSelectPageService,
        resizeImageService,
        restApiUrl,
        template
    ) {
        'ngInject';

        var
            vm = this,
            originalWidth = null,
            originalHeight = null,
            originalImage = null;

        this.$onInit = function () {
            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * gets the correct icons
             */
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * marks that we are in create mode
             * @type {boolean}
             */
            vm.mode = 'create';

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * Add current project
             */
            if (ProjectSidebarService.project) {
                vm.projectPks.push(ProjectSidebarService.project.pk);
            }

            /**
             * initialize picture with an empty project
             */
            vm.picture = {};

            /**
             * Background image URL (so that we can display it in the browser)
             * @type {null}
             */
            vm.pictureBackgroundImageUrl = null;

            /**
             * Whether the aspect ratio should be kept or not
             * @type {boolean}
             */
            vm.keepAspectRatio = true;

            /**
             * Whether the file needs to be converted on upload
             * @type {boolean}
             */
            vm.fileNeedsToBeConverted = false;
        };

        // either copy element from a template or create a new kanban board
        if (template) {
            vm.picture = template;
            if (vm.picture.projects) {
                vm.projectPks = vm.picture.projects;
            }
        } else {
            vm.picture = {};
        }

        /**
         * Load an image File
         *
         * sets picture.width, .height and .aspectRatio
         * @param imageFile
         */
        var loadImage = function (imageFile) {
            originalImage = new Image();

            // get an URL for the image
            vm.pictureBackgroundImageUrl = originalImage.src = URL.createObjectURL(imageFile);

            originalImage.onload = function () {
                // set width and height using $timeout (new digest cycle)
                $timeout(function () {
                    vm.picture.width = originalWidth = originalImage.width;
                    vm.picture.height = originalHeight = originalImage.height;
                    vm.picture.aspectRatio = originalImage.width / originalImage.height;
                });
            }
        };

        /**
         * Exports the provided PDF Page to a blob (png)
         * @param page
         * @returns {*}
         */
        var exportPdfPageCanvasAsBlob = function (page) {
            var defer = $q.defer();

            // define a viewport that is sufficently large for the PDF to be displayed
            var viewport = page.getViewport(1.5);
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // render the page
            page.render(renderContext).then(function () {
                canvas.toBlob(function (blob) {
                    defer.resolve(blob);
                });
            });

            return defer.promise;
        };

        /**
         * Convert PDF to Png
         *
         * This opens a Modal Dialog where the user is presented a preview of the PDF
         *
         * The user needs to select the page that needs to be converted
         * @param pdfFile
         * @returns {*}
         */
        var convertPdfToPng = function (pdfFile) {
            var defer = $q.defer();

            var fileReader = new FileReader();

            // load the pdf file into memory
            fileReader.onload = function (ev) {
                // now load the file using pdf.js
                window.pdfjsLib.getDocument(fileReader.result).then(function loadPdf (pdf) {
                    if (pdf.numPages === 1) {
                        // only a single page, we can convert it immediately
                        pdf.getPage(1).then(exportPdfPageCanvasAsBlob).then(function (theBlob) {
                            defer.resolve(new File([theBlob], pdfFile.name + ".png"));
                        });
                    } else {
                        // ask the user which page they want to import
                        var modalInstance = pdfPreviewSelectPageService.openModal(pdf);

                        modalInstance.result.then(
                            function convert (pageNumber) {
                                // finally, convert the page into a PNG file
                                pdf.getPage(pageNumber).then(exportPdfPageCanvasAsBlob).then(function (theBlob) {
                                    defer.resolve(new File([theBlob], pdfFile.name + "_page" + pageNumber + ".png"));
                                });
                            },
                            function dismiss () {
                                // dismiss the create modal as we don't want to create an "empty" picture here
                                vm.dismiss();
                                defer.reject();
                            }
                        );
                    }
                });
            };

            // read file
            fileReader.readAsArrayBuffer(pdfFile);

            return defer.promise;
        };


        /**
         * Converts a Tiff to a PNG via REST API
         * @param imageFile
         * @returns {*}
         */
        var convertTiffToPng = function (imageFile) {
            var defer = $q.defer();

            var data = {
                file: imageFile
            };

            $http.post(
                restApiUrl + 'convert_tiff_to_png/',
                data,
                {
                    responseType: 'arraybuffer',
                    headers: {'Content-Type': undefined},
                    transformRequest: function (data, headersGetter) {
                        var formData = new FormData();

                        angular.forEach(data, function (value, key) {
                            formData.append(key, value);
                        });

                        return formData;
                    }
                }
            ).then(function success (response) {
                var theBlob = new Blob([response.data], {type: 'image/png'});

                theBlob.lastModifiedDate = new Date();
                theBlob.name = imageFile.name + ".png";

                // update the background image, as if we always had a png file to start with
                vm.picture.background_image = [theBlob];

                defer.resolve(theBlob);
            }, function error (rejection) {
                // error: could not convert (or similar)

                // reset
                vm.picture.background_image = undefined;

                defer.reject(rejection);
            });

            return defer.promise;
        };

        /**
         * Watch the background image and set width/height of the canvas
         */
        $scope.$watch("vm.picture.background_image", function () {
            vm.fileNeedsToBeConverted = false;

            if (vm.picture.background_image) {
                // reset errors
                vm.errors = {};
                console.log("pictureCreateModal: Got a file of type " + vm.picture.background_image[0].type);

                if (vm.picture.background_image[0].type == "image/tiff") {
                    /**
                     * we can not use TIFF files within the picture editor, we need to convert it
                     *
                     * -> Notify the user about that, or let the user abort
                     */
                    //
                    console.log("pictureCreateModal: Got a tiff file, notifying user...");
                    vm.fileNeedsToBeConverted = true;

                    // reset picture data
                    vm.picture.width = 0;
                    vm.picture.height = 0;
                    vm.picture.aspectRatio = 0;

                    // notify user that the picture needs to be converted first
                    var modalInstance = confirmDialogWidget.open({
                        title: gettextCatalog.getString("TIFF Files need to be converted"),
                        message: gettextCatalog.getString(
                            "The file needs to be converted to PNG before it can be uploaded."
                        ),
                        cancelButtonText: gettextCatalog.getString('Cancel'),
                        okButtonText: gettextCatalog.getString('Continue'),
                        dialogKey: 'ConvertTiff'
                    });

                    modalInstance.result.then(
                        function success (doContinue) {
                            if (doContinue) {
                                convertTiffToPng(vm.picture.background_image[0]).then(
                                    function success (image) {
                                        // all okay
                                    },
                                    function error (rejection) {
                                        vm.errors['background_image'] =
                                            [gettextCatalog.getString("The TIF file could not be converted")];
                                    }
                                );
                            } else {
                                console.log("TIF converting canceled");
                                // dismiss the create modal as we don't want to create an "empty" picture here
                                vm.dismiss();
                            }
                        },
                        function dismiss () {
                            console.log("dismissed");
                        }
                    );
                } else if (vm.picture.background_image[0].type == "application/pdf") {
                    console.log("pictureCreateModal: Got a PDF file, we need to take special care of this file");

                    vm.fileNeedsToBeConverted = true;

                    vm.picture.width = 0;
                    vm.picture.height = 0;
                    vm.picture.aspectRatio = 0;

                    convertPdfToPng(vm.picture.background_image[0]).then(function (imageFile) {
                        vm.picture.background_image = [imageFile];
                    }, function dismiss () {
                        console.log("Conversion canceled");
                    });
                } else {
                    console.log("Image has changed, calculating width/height");
                    loadImage(vm.picture.background_image[0]);
                }
            }
        });

        /**
         * Uploads picture via REST
         * @param data
         * @returns {*}
         */
        var createViaRest = function (data) {
            vm.errors = {};

            return PictureRestService.create(data).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Picture created"));

                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    // handle insufficient storage error - occurs when user storage limit was reached
                    if (rejection.status == 507) {
                        // handle insufficient storage error - occurs when user storage limit was reached
                        var rejectionMessage = GlobalErrorHandlerService.handleRestApiStorageError(rejection);

                        console.log(rejection);

                        toaster.pop('error', rejectionMessage.toasterTitle, rejectionMessage.toasterMessage);
                        vm.errors['background_image'] = [rejectionMessage.validationMessage];
                    } else {
                        toaster.pop('error', gettextCatalog.getString("Failed to create Picture"));
                        console.log(rejection);
                        vm.errors = rejection.data;

                        if (rejection.status == 403) {
                            // permission denied -> this is most likely due to the fact that the user does not have the
                            // appropriate permissions in the selected project
                            if (vm.picture.projects && vm.picture.projects.length > 0) {
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new Picture in at least one of the " +
                                        "specified projects"
                                    )
                                ];
                            } else {
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new Picture without selecting a project"
                                    )
                                ];
                            }
                        }
                    }
                }
            );
        };


        /**
         * create a new picture
         */
        vm.create = function () {
            // assign projects
            vm.picture.projects = vm.projectPks;

            // give empty picture a width and height so they can be created
            if (!vm.picture.background_image && !vm.picture.width) {
                vm.picture.width = 512;
            }
            if (!vm.picture.background_image && !vm.picture.height) {
                vm.picture.height = 512;
            }

            // check if we need to re-size the image
            if (originalImage && (vm.picture.width != originalWidth || vm.picture.height != originalHeight)) {
                console.log("Image needs to be resized!");
                resizeImageService.resizeImage(
                    originalImage, vm.picture.width, vm.picture.height
                ).then(
                    function resized (resizedImageBlob) {
                        resizedImageBlob.name = vm.picture.background_image.name;

                        // copy the original object so we don't overwrite the original image
                        var data = angular.copy(vm.picture);

                        data.background_image = resizedImageBlob;

                        createViaRest(data);
                    }
                );
            } else {
                createViaRest(vm.picture);
            }
        };

        /**
         * Dismiss the modal dialog
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };

        /**
         * Keep aspect ratio for height based on width
         * This is accomplished by rounding the difference between newValue and oldValue, and if there is a difference
         * of at least 1 pixel, we re-calculate the height
         */
        $scope.$watch("vm.picture.width", function (newValue, oldValue) {
            if (Math.round(newValue - oldValue) != 0 && vm.keepAspectRatio) {
                if (vm.picture.width != "") {
                    if (vm.picture.width < 1) {
                        vm.picture.width = originalWidth;
                    }
                    vm.picture.height = Math.round(parseFloat(vm.picture.width) / vm.picture.aspectRatio);
                }
            }
        });

        /**
         * Keep aspect ratio for width based on height
         * This is accomplished by rounding the difference between newValue and oldValue, and if there is a difference
         * of at least 1 pixel, we re-calculate the width
         */
        $scope.$watch("vm.picture.height", function (newValue, oldValue) {
            if (Math.round(newValue - oldValue) != 0 && vm.keepAspectRatio) {

                if (vm.picture.height != "") {
                    if (vm.picture.height < 1) {
                        vm.picture.height = originalHeight;
                    }
                    vm.picture.width = Math.round(parseFloat(vm.picture.height) * vm.picture.aspectRatio);
                }
            }
        });
    });
})();
