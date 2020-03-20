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
     * @name driveDisplayWidget
     *
     * @restrict E
     *
     * @memberOf module:widgets
     *
     * @description
     * Displays a drive with all it sub directories and files as a tree view
     *
     * @param {object} drive - the drive that needs to be displayed
     */
    module.directive('driveDisplayWidget', function () {
        'ngInject';

        return {
            templateUrl: 'js/widgets/driveWidgets/driveDisplayWidget.html',
            restrict: 'E',
            bindToController: true,
            controllerAs: 'vm',
            controller: 'DriveDisplayWidgetController',
            scope: {
                drive: '='
            }
        };
    });

    /**
     * Controller for `driveDisplayWidget`
     */
    module.controller('DriveDisplayWidgetController', function (
        $scope,
        $uibModal,
        $q,
        confirmDialogWidget,
        gettextCatalog,
        toaster,
        driveCreateEditSubdirectoryModalService,
        DriveRestService,
        DriveSubDirectoryRestService,
        FileIconService,
        FileRestService,
        FileDownloadRestService,
        FileSaver,
        GlobalErrorHandlerService,
        IconImagesService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * Drive Icon
             * @type {string}
             */
            vm.driveIcon = IconImagesService.mainElementIcons.drive;

            /**
             * List of files of this drive
             * @type {Array}
             */
            vm.files = [];

            /**
             * Search string for file list
             * @type {string}
             */
            vm.searchString = "";

            vm.driveSubDirectoryRestService = DriveSubDirectoryRestService(vm.drive.pk);

            getFilesForDrive(vm.drive);
        };

        /**
         * Add a new sub directory
         *
         * Opens a modal dialog and asks the user for a name of the sub directory
         * This name needs to be unique for the associated drive
         * @params parentDirectory: optional parent directory
         */
        vm.addNewSubdirectory = function (parentDirectory) {
            var modal = driveCreateEditSubdirectoryModalService.openCreate(vm.drive, parentDirectory);

            modal.result.then(
                function success () {
                    vm.drive.$getCached();
                }, function error () {
                    // nothing to do on cancel
                });
        };

        /**
         * Opens a modal dialog to rename a directory
         */
        vm.renameDirectory = function (directory) {
            var modal = driveCreateEditSubdirectoryModalService.openEdit(vm.drive, directory);

            modal.result.then(
                function sucess () {
                    vm.drive.$getCached();
                }, function reject () {
                    // nothing to do on cancel
                });
        };

        /**
         * Open a modal dialog and show information about webdav
         */
        vm.showWebDavInformation = function () {
            $uibModal.open({
                templateUrl: 'js/screens/drive/webdavModalInformation.html',
                controller: 'WebdavModalInformationController',
                backdrop: 'static',
                controllerAs: 'vm',
                resolve: {
                    drive: function () {
                        return vm.drive;
                    }
                }
            });
        };

        /**
         * store search string
         * @param searchString
         */
        vm.doSearch = function (searchString) {
            vm.searchString = searchString;
        };

        /**
         * Cancel search
         */
        vm.cancelSearch = function () {
            vm.searchString = "";
        };

        /**
         * Opens a modal dialog and asks the user whether they want to remove the directory
         * @param directory
         */
        vm.removeDirectory = function (directory) {
            // show a modal dialog whether the user really wants to delete this entry
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Remove?'),
                message: gettextCatalog.getString('Do you really want to remove this folder and all its sub folders?'),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Remove'),
                dialogKey: 'RemoveDirectory'
            });

            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        vm.driveSubDirectoryRestService.delete(directory).$promise.then(
                            function success (response) {
                                toaster.pop('success', gettextCatalog.getString("Removed"));
                                vm.drive.$getCached();
                            },
                            function error (rejection) {
                                console.log(rejection);
                                toaster.pop('error', gettextCatalog.getString("Failed to remove folder"));
                                vm.drive.$getCached();
                            }
                        );
                    }
                }
            );
        };

        /**
         * Triggers a download of the file via REST API
         * @param file the file that needs to be downloaded
         */
        vm.downloadFile = function (file) {
            FileDownloadRestService.download(file.download).then(
                function success (response) {
                    // get mime-type
                    var mimeType = response.headers('content-type');
                    //get the file name from the http content-disposition header
                    var contentDisposition = response.headers('content-disposition');

                    vm.filename = contentDisposition.split("\"")[1];
                    //download file
                    var data = new Blob([response.data], {type: mimeType + 'charset=utf-8'});

                    FileSaver.saveAs(data, vm.filename);
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to download file"));
                }
            );
        };

        /**
         * Trash a file via rest api $softDelete method
         * @param file
         */
        vm.trashFile = function (file) {
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Trash?'),
                message: gettextCatalog.getString('Do you really want to trash this element'),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Trash'),
                dialogKey: 'TrashFile'
            });

            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        file.$softDelete().then(
                            function success (response) {
                                toaster.pop('success', gettextCatalog.getString("Trashed"));
                            },
                            function error (rejection) {
                                console.log(rejection);
                                if (rejection.data && rejection.data.non_field_errors) {
                                    toaster.pop('error', gettextCatalog.getString("Trash failed"),
                                        rejection.data.non_field_errors.join(" ")
                                    );
                                } else {
                                    toaster.pop('error', gettextCatalog.getString("Trash failed"));
                                }
                            }
                        );
                    }
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }
            );
        };

        /**
         * Move an existing file of the drive to an existing directory
         * @param file
         * @param directory
         */
        vm.moveFileOrDirectory = function (targetElement, targetDirectory) {
            if (targetElement.content_type_model == 'shared_elements.file') {
                // move file
                FileRestService.updatePartial({
                    'pk': targetElement.pk, // pk of the file that is moved
                    'directory_id': targetDirectory.pk // pk of the parent directory that we are moving it to
                }).$promise.then(
                    function success (response) {
                        getFilesForDrive(vm.drive);
                    }, function error (rejection) {
                        toaster.pop('error', gettextCatalog.getString("Failed to move file"));
                    }
                );
            } else if (targetElement.content_type_model == 'drives.directory') {
                // move directory within the current drive
                DriveSubDirectoryRestService(targetElement.drive_id).updatePartial({
                    'pk': targetElement.pk, // pk of the directory that is moved
                    'directory': targetDirectory.pk // pk of the parent directory that we are moving it to
                }).$promise.then(
                    function success (response) {
                        // update drive after moving a directory
                        vm.drive.$getCached();
                    }, function error (rejection) {
                        if (rejection.data && rejection.data.directory) {
                            toaster.pop(
                                'error', gettextCatalog.getString("Failed to move folder"),
                                rejection.data.directory.join(", ")
                            );
                        }
                    }
                );
            }
        };

        /**
         * Upload multiple files to the specified directory
         * @param files
         * @param directory
         */
        vm.uploadFile = function (files, directory, event) {
            if (files.length == 0) {
                // nothing to do
                return;
            }

            var promises = [];

            var filesUploaded = 0;

            var successFunction = function successFunction (response) {
                filesUploaded += 1;
                console.log("Uploaded files: " + filesUploaded + "/" + files.length);
            };

            for (var i = 0; i < files.length; i++) {
                // file
                var file = files[i];

                // collect the REST API create promises
                promises.push(
                    // create a new file via REST API
                    FileRestService.create({
                        'name': file.name,
                        'path': file,
                        'directory_id': directory.pk,
                        'projects': vm.drive.projects
                    }).$promise.then(
                        successFunction,
                        function error (rejection) {
                            console.log(rejection);

                            if (rejection.status == 507) {
                                // handle insufficient storage error - occurs when user storage limit was reached
                                var rejectionMessage =
                                    GlobalErrorHandlerService.handleRestApiStorageError(rejection);

                                toaster.pop('error', rejectionMessage.toasterTitle, rejectionMessage.validationMessage);
                            } else if (rejection.data && rejection.data.non_field_errors) {
                                // report with errors
                                toaster.pop('error', gettextCatalog.getString("Upload failed"),
                                    rejection.data.non_field_errors.join(", "));
                            } else {
                                toaster.pop('error', gettextCatalog.getString("Upload failed"));
                            }
                        }
                    )
                );
            }

            // when finished, update the file list
            $q.all(promises).then(
                function success (element) {
                    getFilesForDrive(vm.drive);
                }
            );
        };

        /**
         * Get all files for the current drive (using the /api/files/ endpiont with a filter ?drive=)
         * @param drive
         */
        var getFilesForDrive = function (drive) {
            // refresh drive (just in case)
            drive.$getCached();

            FileRestService.queryCached({drive: drive.pk}).$promise.then(
                function success (response) {
                    // iterate over files and set a file icon
                    for (var i = 0; i < response.length; i++) {
                        var file = response[i];

                        file.icon = FileIconService.getFileTypeIcon(file.original_filename);
                    }

                    vm.files = response;
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to query files of this storage"));
                }
            )
        };
    });
})();
