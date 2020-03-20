/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Widget for selecting one or many directories within a tree
     */
    module.directive('directoryDriveTreeSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/directoryDriveTreeSelectizeWidget.html',
            controller: 'DirectoryDriveTreeSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                selectedDirectoryPk: '='
            }
        }
    });

    module.controller('DirectoryDriveTreeSelectizeWidgetController', function (
        $scope,
        $timeout,
        IconImagesService,
        DriveRestService
    ) {
        'ngInject';

        var vm = this;

        /**
         * Order for each element, so we keep the ordering between sub directories etc...
         * @type {number}
         */
        var levelSortOrder = 0;

        var directoryIcon = IconImagesService.genericIcons.directory;
        var driveIcon = IconImagesService.mainElementIcons.drive;

        this.$onInit = function () {
            vm.drives = [];
            vm.drivesByPk = {};
            vm.directories = [];
            vm.directoryLevelsById = {};

            vm.selectizeConfig = {
                plugins: {
                    'remove_button': {
                        mode: 'single'
                    },
                    // activate on enter key plugin
                    'on_enter_key': {}
                },
                create: false,
                nesting: true,
                valueField: 'pk',
                labelField: 'title',
                sortField: 'levelSortOrder',
                placeholder: vm.placeholder,
                searchField: ['title'],
                render: {
                    //formats the dropdown item
                    option: function (item, escape) {
                        var str = '';

                        // display directory
                        str = '<div class="level-' + escape(vm.directoryLevelsById[item.pk]) + '">';

                        if (item.name == '/' && item.is_virtual_root) {
                            // display the drive (as the root folder)
                            str += '<span class="' + driveIcon + '"></span> ';
                            str += '<span>' + escape(vm.drivesByPk[item.drive_id].title) + '</span> ';
                        } else {
                            str += '<span class="' + directoryIcon + '"></span> ';
                            str += '<span>' + escape(item.name) + '</span> ';
                        }

                        str += '</div>';


                        return str;
                    },
                    // formats the selected item
                    item: function (item, escape) {
                        // display directory (and the drive it is on)

                        var str = '<div>';

                        // display the drive this directory is in
                        str += '<span class="' + driveIcon + '"></span> ';

                        if (vm.drivesByPk[item.drive_id]) {
                            str += escape(vm.drivesByPk[item.drive_id].title);
                        } else {
                            str += item.drive_id;
                        }

                        if (!item.is_virtual_root) {
                            str += ' / ';

                            // if additionally there is a parent directory, display dots
                            if (item.directory && vm.directoryLevelsById[item.directory] > 0) {
                                str += '... / ';
                            }

                            // display directory details
                            str += '<span class="' + directoryIcon + '"></span> ';

                            str += '<span>' + escape(item.name) + '</span> ';
                        }

                        str += '</div>';

                        return str;
                    }
                },
                onInitialize: function (selectize) {
                    // store selectize element
                    vm.selectize = selectize;

                    // check for readonly (needs to be done in next digest cycle)
                    $timeout(function () {
                        if (vm.ngReadonly) {
                            selectize.lock();
                        }
                    });

                    // on enter key press, emit a onSubmit event
                    selectize.on('enter', function () {
                        console.log('on enter');
                        $scope.$emit("selectize:onSubmit");
                    });
                },
                maxItems: 1
            };
        };

        // watch ngReadonly and lock/unlock the selectize element (if it is already activated)
        $scope.$watch("vm.ngReadonly", function (newValue, oldValue) {
            if (vm.selectize) {
                if (newValue) {
                    vm.selectize.lock();
                } else {
                    vm.selectize.unlock();
                }
            }
        });

        /**
         * Build the directory tree
         * @param directories
         */
        var buildDirectorysTree = function (directoryList) {
            var rootDirectories = [];

            // initialize children array
            angular.forEach(directoryList, function (directory) {
                vm.directories.push(directory);

                if (!directory.directory) {
                    rootDirectories.push(directory);
                }

                directory.children = [];

                // push into directories dict
                vm.directoriesDict[directory.pk] = directory;
            });

            angular.forEach(directoryList, function (directory) {
                // check if parent directory is set and exists
                if (directory.directory && vm.directoriesDict[directory.directory]) {
                    // add to parent directory
                    vm.directoriesDict[directory.directory].children.push(directory);
                }
            });

            return rootDirectories;
        };


        var generateTreeLevels = function (data, level) {
            angular.forEach(data, function (obj) {
                levelSortOrder++;
                // store levels by id
                vm.directoryLevelsById[obj.pk] = level;

                obj.levelSortOrder = levelSortOrder;

                if (obj.children) {
                    generateTreeLevels(obj.children, level + 1);
                }
            });
        };

        var getDrives = function () {
            return DriveRestService.queryCached().$promise.then(
                function success (response) {
                    vm.drives = response;

                    for (var i = 0; i < vm.drives.length; i++) {
                        vm.drivesByPk[vm.drives[i].pk] = vm.drives[i];
                    }
                },
                function error (rejection) {
                    console.log(rejection);
                }
            );
        };

        getDrives().then(
            function () {
                levelSortOrder = 0;

                vm.directoriesDict = {};

                vm.directories = [];

                for (var i = 0; i < vm.drives.length; i++) {
                    var rootDirectories = buildDirectorysTree(vm.drives[i].sub_directories);

                    generateTreeLevels(rootDirectories, 0);
                }
            }
        );
    });
})();
