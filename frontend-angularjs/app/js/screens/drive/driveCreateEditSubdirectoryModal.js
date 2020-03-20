/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.service('driveCreateEditSubdirectoryModalService', function ($uibModal) {
        "ngInject";

        var service = {};

        service.openCreate = function (drive, parentDirectory) {
            return $uibModal.open({
                templateUrl: 'js/screens/drive/driveCreateEditSubdirectoryModal.html',
                controller: 'DriveCreateEditSubdirectoryModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    drive: function () {
                        return drive;
                    },
                    directory: function () {
                        return null;
                    },
                    parentDirectory: function () {
                        if (!parentDirectory) {
                            // iterate over drive.sub_directories and find the one that is the root
                            for (var i = 0; i < drive.sub_directories.length; i++) {
                                if (drive.sub_directories[i].is_virtual_root) {
                                    parentDirectory = drive.sub_directories[i];
                                    break;
                                }
                            }
                        }

                        return parentDirectory;
                    },
                    isEditing: function () {
                        return false;
                    }
                }
            });
        };

        service.openEdit = function (drive, directory) {
            return $uibModal.open({
                templateUrl: 'js/screens/drive/driveCreateEditSubdirectoryModal.html',
                controller: 'DriveCreateEditSubdirectoryModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    drive: function () {
                        return drive;
                    },
                    directory: function () {
                        return directory;
                    },
                    parentDirectory: function () {
                        return null;
                    },
                    isEditing: function () {
                        return true;
                    }
                }
            });
        };

        return service;
    });

    module.controller('DriveCreateEditSubdirectoryModalController', function (
        $uibModalInstance,
        DriveSubDirectoryRestService,
        gettextCatalog,
        toaster,
        // provided by $uibModal.open
        directory,
        drive,
        isEditing,
        parentDirectory
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            /**
             * Whether this modal dialog is meant for editing or not
             * @type {boolean}
             */
            vm.isEditing = isEditing;

            /**
             * Parent directory pk
             * @type {uuid}
             */
            vm.parentDirectoryPk = null;

            if (parentDirectory) {
                vm.parentDirectoryPk = parentDirectory.pk;
            }

            /**
             * Name of the directory
             * @type {string}
             */
            vm.name = '';

            // set title of the directory that is being edited
            if (isEditing && directory) {
                vm.name = directory.name;

                vm.directory = directory;

                vm.parentDirectoryPk = directory.directory;
            }

            /**
             * The drive that this directory belongs to
             * @type {drive|*}
             */
            vm.drive = drive;

            /**
             * Error Dictionary for errors coming from REST API
             * @type {{}}
             */
            vm.errors = {};

            /**
             * All directories of this drive
             * @type {Array}
             */
            vm.directories = [];

            /**
             * Rest Service for creating / editing sub directories
             */
            vm.driveSubDirectoryRestService = DriveSubDirectoryRestService(vm.drive.pk);

            // get all directories of this drive
            vm.driveSubDirectoryRestService.queryCached().$promise.then(
                function success (response) {
                    vm.directories = response;
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to query directories"));
                }
            );
        };

        /**
         * Save changes via REST API, close the modal afterwards
         */
        vm.save = function () {
            var data = {
                'name': vm.name
            };

            if (vm.parentDirectoryPk) {
                data['directory'] = vm.parentDirectoryPk;
            } else {
                // set to null explicitly so we can change it via REST API
                data['directory'] = null;
            }

            if (vm.isEditing) {
                data['pk'] = vm.directory.pk;

                // update directory via REST API
                vm.driveSubDirectoryRestService.updatePartial(data).$promise.then(
                    function success (response) {
                        $uibModalInstance.close();
                    },
                    function error (rejection) {
                        vm.errors = rejection.data;
                    }
                );
            } else {
                // create directory via REST API
                vm.driveSubDirectoryRestService.create(data).$promise.then(
                    function success (response) {
                        $uibModalInstance.close();
                    },
                    function error (rejection) {
                        vm.errors = rejection.data;
                    }
                );
            }
        };

        /**
         * Dismiss the modal
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    })
})();
