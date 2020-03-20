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
     * @name driveDirectoryDisplayWidget
     *
     * @restrict E
     *
     * @memberOf module:widgets
     *
     * @description
     * Widget which recursively displays all children of a parent directory
     * It expects a full list of directories and files, as well as the current parent directory.
     */
    module.directive('driveDirectoryDisplayWidget', function () {
        'ngInject';

        return {
            templateUrl: 'js/widgets/driveWidgets/driveDirectoryDisplayWidget.html',
            restrict: 'E',
            bindToController: true,
            controllerAs: 'vm',
            controller: 'DriveDirectoryDisplayWidgetController',
            scope: {
                directories: '=', // list of directories for this drive
                files: '=', // list of files for this drive
                parentDirectory: '=?',
                createNewDirectory: '=',
                downloadFile: '=',
                renameDirectory: '=',
                removeDirectory: '=',
                uploadFile: '=',
                moveFileOrDirectory: '=',
                trashFile: '=',
                searchString: '=',
                drive: '='
            }
        };
    });

    /**
     * Controller for driveDirectoryDisplayWidget
     */
    module.controller('DriveDirectoryDisplayWidgetController', function (
        $scope,
        $q,
        toaster,
        gettextCatalog,
        IconImagesService,
        FileIconService,
        FileRestService,
        ChooseExistingFilesModalService
    ) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            /**
             * Dictionary for UIB Collapse that defines whether to show sub directories and files of a certain
             * directory
             * Index by directory.pk
             * @type {{}}
             */
            vm.showSubDirectories = {};

            vm.downloadIcon = FileIconService.download;

            vm.driveIcon = IconImagesService.mainElementIcons.drive;
        };

        /**
         * Toggles whether sub directories should be shown
         * Sub-directories are shown by setting vm.showSubDirectories[pk] to True, and hidden by default (False)
         * @param directoryPk primary key of the directory that needs to be shown
         */
        vm.toggleShowSubdirectories = function (directoryPk) {
            vm.showSubDirectories[directoryPk] = !vm.showSubDirectories[directoryPk];
        };

        /**
         * Angular Filter that filters the current directory based on its parent directory and the parent directory
         * which is set for this directive
         * @param directory
         * @returns {boolean}
         */
        vm.filterByParent = function (directory) {
            if (!directory.directory && !vm.parentDirectory) {
                return true;
            }

            if (directory.directory && vm.parentDirectory &&
                vm.parentDirectory.pk == directory.directory) {
                return true;
            }

            return false;
        };

        /**
         * Filter for searching for filename (either .name or .original_filename)
         * @param file
         * @returns {boolean}
         */
        vm.filterForFilenameSearch = function (file) {
            if (vm.searchString == '') {
                return true;
            }

            if (file.name.toLowerCase().indexOf(vm.searchString.toLowerCase()) >= 0) {
                return true;
            }

            if (file.original_filename.toLowerCase().indexOf(vm.searchString.toLowerCase()) >= 0) {
                return true;
            }

            return false;
        };

        /**
         * Opens a file picker and lets the user select a file for upload
         */
        var selectFileWithFilePicker = function (acceptFileType) {
            var defer = $q.defer();

            // "fake" an input element of type file
            var input = document.createElement('input');

            input.setAttribute('type', 'file');
            input.setAttribute('multiple', '');

            if (acceptFileType && typeof acceptFileType !== "undefined") {
                input.setAttribute('accept', acceptFileType);
            }

            input.onchange = function () {
                defer.resolve(this.files);
            };

            // click it
            input.click();

            return defer.promise;
        };

        /**
         * Displays a file dialog, and on successful selection of a file, vm.uploadFile is called
         * @param directory
         */
        vm.showFileSelectDialog = function (directory) {
            selectFileWithFilePicker().then(
                function success (files) {
                    vm.uploadFile(files, directory);
                }
            );
        };

        /**
         * Displays a dialog where the user can choose an already uploaded file to add to the directory.
         * @param directory
         */
        vm.showAddExistingFileDialog = function (directory) {
            var modal = ChooseExistingFilesModalService.open();

            modal.result.then(
                function chosen (file) {
                    if (file.directory_id == null) {
                        addFileToDirectory(file, directory);
                    } else {
                        toaster.pop('error', gettextCatalog.getString("File is assigned to a storage already"));
                    }
                },
                function dismissed () {
                    // nothing to do
                }
            );
        };

        var addFileToDirectory = function (file, directory) {
            var data = {
                'pk': file.pk,
                'directory_id': directory.pk
            };

            FileRestService.updatePartial(data).$promise.then(
                function success (response) {
                    file = response;
                    file.icon = FileIconService.getFileTypeIcon(file.original_filename);
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not assign file to storage"));
                }
            );
        };
    });

})();
