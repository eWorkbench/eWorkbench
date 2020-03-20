/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    /**
     * A directive which formats a 'drive' object coming from the REST API
     */
    module.directive('directoryLink', function () {
        return {
            templateUrl: 'js/widgets/link/directoryLink.html',
            controller: "DirectoryLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                directoryPk: '=',
                drive: '=?'
            }
        }
    });

    module.controller('DirectoryLinkController', function (
        $scope,
        $state,
        DriveRestService,
        IconImagesService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            /**
             * List of drives (from rest api)
             * @type {Array}
             */
            vm.drives = [];

            /**
             * The selected directory
             */
            vm.directory = null;

            /**
             * The selected drive
             * @type {null}
             */
            vm.drive = null;

            /**
             * The URL of the selected drive
             * @type {string}
             */
            vm.driveUrl = "";

            /**
             * Dictionary containing all directories by their pk
             * @type {{}}
             */
            vm.directoriesByPk = {};

            vm.driveIcon = IconImagesService.mainElementIcons.drive;
            vm.directoryIcon = IconImagesService.genericIcons.directory;

            getDrives().then(processDrive);
        };

        /**
         * Watch Drive and generate an URL for the given drive
         */
        $scope.$watch("vm.drive", function () {
            if (vm.drive) {
                vm.driveUrl = $state.href("drive-view", {drive: vm.drive});
            } else {
                vm.driveUrl = "";
            }
        });

        /**
         * Get all drives and its sub directories (from cache), and figure out which one is the correct drive based
         * on the given directoryPk
         * @returns {*}
         */
        var getDrives = function () {
            return DriveRestService.queryCached().$promise.then(
                function success (response) {
                    vm.drives = response;

                    // iterate over drives and check if the drive contains the directoryPk
                    for (var i = 0; i < vm.drives.length; i++) {
                        // check sub directories
                        for (var j = 0; j < vm.drives[i].sub_directories.length; j++) {
                            if (vm.drives[i].sub_directories[j].pk == vm.directoryPk) {
                                // found
                                vm.drive = vm.drives[i];
                                vm.directory = vm.drives[i].sub_directories[j];

                                return;
                            }
                        }
                    }
                },
                function error (rejection) {
                    console.log(rejection);
                }
            );
        };

        /**
         * Iterates over all sub directories of vm.drive
         */
        var processDrive = function () {
            vm.directoriesByPk = {};

            for (var j = 0; j < vm.drive.sub_directories.length; j++) {
                vm.directoriesByPk[vm.drive.sub_directories[j].pk] = vm.drive.sub_directories[j];
            }
        };
    });
})();
