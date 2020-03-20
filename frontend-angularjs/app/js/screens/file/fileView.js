/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Scope stack view for file view.
     */
    module.component('fileView', {
        templateUrl: 'js/screens/file/fileView.html',
        controller: 'FileViewController',
        controllerAs: 'vm',
        bindings: {
            'project': '<',
            'file': '<'
        }
    });

    /**
     * Smalle file view, e.g. for the version-restore-preview.
     */
    module.component('smallFileView', {
        templateUrl: 'js/screens/file/smallFileView.html',
        controller: 'FileViewController',
        controllerAs: 'vm',
        bindings: {
            'project': '<',
            'file': '<',
            'readOnly': '<'
        }
    });

    /**
     * File Detail View Controller
     *
     * Displays the File Detail View
     */
    module.controller('FileViewController', function (
        $scope,
        $q,
        gettextCatalog,
        toaster,
        selectFileWithPicker,
        FileSaver,
        FileDownloadRestService,
        FileRestService,
        GlobalErrorHandlerService,
        IconImagesService,
        FileIconService,
        PermissionService,
        $timeout,
        editableFormElementUnsavedChangesService
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
             * gets the correct icons
             */
            vm.editIcon = IconImagesService.mainActionIcons.edit;
            vm.downloadIcon = FileIconService.download;
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * Whether the element is currently locked or not (determined by vm.onLock and vm.onUnlock)
             * @type {boolean}
             */
            vm.isLocked = false;

            /**
             * Watch filename and choose icon
             */
            $scope.$watch("vm.file.original_filename", function () {
                if (vm.file.original_filename) {
                    vm.fileIcon = FileIconService.getFileTypeIcon(vm.file.original_filename);
                } else {
                    vm.fileIcon = IconImagesService.mainElementIcons.file;
                }
            });

            updateProjectPks(vm.file);
        };

        /**
         * Called by generic-show-element-lock-status-widget when the element is locked (by someone else)
         */
        vm.onLock = function () {
            vm.isLocked = true;
        };

        /**
         * Called by generic-show-element-lock-status-widget when the element is unlocked
         */
        vm.onUnlock = function () {
            vm.isLocked = false;
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.file);
        };

        /**
         * Updates a list of project pks
         * This is necessary as the list of PKs has a different reference,
         * and the angular $watchGroup does not allow
         * to watch for array changes
         * @param file
         */
        var updateProjectPks = function (file) {
            vm.projectPks.length = 0;
            if (file.projects) {
                for (var i = 0; i < file.projects.length; i++) {
                    vm.projectPks.push(file.projects[i]);
                }
            }
        };

        /**
         * reset errors
         */
        vm.resetErrors = function () {
            vm.errors = {};
        };

        /**
         * Save a file via REST API as a full update
         */
        vm.saveFile = function (file) {
            var previousFile = angular.copy(vm.file);

            vm.readOnly = true;
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // reset path, we dont need to overwrite it via the API, unless it is explicitly set by the user
            if (vm.file.path == "") {
                vm.file.path = undefined;
            }

            if (!vm.file.directory_id) {
                // delete instead of setting it null to enable file uploads while editing
                delete vm.file.directory_id;
            }

            // set projects
            vm.file.projects = vm.projectPks;

            // when saving/updating the file path we have to check if there is a file
            // then we also have to reset the edit buttons in this case as they wouldn't go away otherwise
            // the content in all edited fields is saved
            if (file) {
                vm.file.path = file;
                vm.file.name = vm.file.path[0].name;
                $timeout(function () {
                    // switch back to view mode for all unsaved elements
                    editableFormElementUnsavedChangesService.toggleVisibilityForAllUnsavedElements();
                });
            }

            // update file via rest api - we are doing a partial update, just in case the path is not set
            vm.file.$updatePartial().then(
                function success (response) {
                    updateProjectPks(response);
                    // worked
                    vm.file = response;
                    d.resolve();
                },
                function error (rejection) {
                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    // handle insufficient storage error - occurs when user storage limit was reached
                    if (rejection.status == 507) {
                        var rejectionMessage = GlobalErrorHandlerService.handleRestApiStorageError(rejection);

                        console.log(rejection);

                        toaster.pop('error', rejectionMessage.toasterTitle, rejectionMessage.toasterMessage);
                        vm.errors['path'] = [rejectionMessage.validationMessage];

                        d.reject(rejectionMessage.toasterTitle);
                    } else if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        d.reject(rejection.data);
                        vm.errors = rejection.data;
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update File"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).then(function () {
                vm.saveFilePartial("metadata", previousFile["metadata"]);
            }).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Button for uploading a new file
         */
        vm.uploadNewFile = function () {
            selectFileWithPicker().then(
                function fileSelected (file) {
                    vm.saveFile(file);
                }
            )
        };

        /**
         * Save a file via REST API partial update
         */
        vm.saveFilePartial = function (key, value) {
            vm.readOnly = true;
            // always initialize with primary key
            var data = {
                pk: vm.file.pk
            };

            if (value) {
                data[key] = value;
            } else {
                data[key] = null;
            }

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // reset path
            if (vm.file.path == "") {
                vm.file.path = undefined;
            }

            FileRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    vm.file = response;
                    // worked
                    d.resolve();
                },
                function error (rejection) {
                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data && rejection.data[key]) {
                        // Validation error - an error message is provided by the api
                        d.reject(rejection.data[key].join(", "));
                        vm.errors = rejection.data;
                    } else if (rejection.data.non_field_errors) {
                        // non_field_error occured (e.g., object has already been trashed/soft-deleted) and can
                        // therefore no longer be edited
                        d.reject(rejection.data.non_field_errors);
                        vm.errors[key] = rejection.data.non_field_errors;
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                        vm.errors[key] = [rejection.data.detail];
                    } else if (rejection.status == 507) {
                        // handle insufficient storage error - occurs when user storage limit was reached
                        var rejectionMessage = GlobalErrorHandlerService.handleRestApiStorageError(rejection);

                        console.log(rejection);

                        toaster.pop('error', rejectionMessage.toasterTitle, rejectionMessage.toasterMessage);
                        vm.errors['path'] = [rejectionMessage.validationMessage];

                        d.reject(rejectionMessage.toasterTitle);
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update File"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                        vm.errors[key] = [gettextCatalog.getString("Unknown error")];
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * download file
         */
        vm.download = function () {
            FileDownloadRestService.download(vm.file.download).then(
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
         * Download a specific revision
         */
        vm.downloadRevision = function (file) {
            FileDownloadRestService.downloadRevision(vm.file.download, file.pk).then(
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
    });
})();
