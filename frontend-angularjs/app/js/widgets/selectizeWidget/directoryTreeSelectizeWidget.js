/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * Widget for selecting one or many directories within a tree
     */
    module.directive('directoryTreeSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/directoryTreeSelectizeWidget.html',
            controller: 'DirectoryTreeSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                selectedDirectoryPk: '=',
                directories: '=',
                drive: '='
            }
        }
    });

    module.controller('DirectoryTreeSelectizeWidgetController', function (
        IconImagesService,
        $scope,
        $timeout
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * Order for each element, so we keep the ordering between sub directories etc...
             * @type {number}
             */
            vm.levelSortOrder = 0;

            var directoryIcon = IconImagesService.genericIcons.directory;
            var driveIcon = IconImagesService.mainElementIcons.drive;

            vm.directoryLevelsById = {};

            vm.flatDirectorys = [];

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
                labelField: 'name',
                sortField: 'levelSortOrder',
                placeholder: vm.placeholder,
                searchField: ['name'],
                render: {
                    //formats the dropdown item
                    option: function (item, escape) {
                        // display directory
                        var str = '<div class="level-' + escape(vm.directoryLevelsById[item.pk]) + '">';

                        if (item.name == '/' && item.is_virtual_root) {
                            str += '<span class="' + driveIcon + '"></span> ';
                            str += '<span>' + escape(vm.drive.title) + '</span> ';
                        } else {
                            str += '<span class="' + directoryIcon + '"></span> ';
                            str += '<span>' + escape(item.name) + '</span> ';
                        }

                        str += '</div>';

                        return str;
                    },
                    //formats the selected item
                    item: function (item, escape) {
                        // display directory
                        if (item.name == '/' && item.is_virtual_root) {
                            return '<div><span class="' + driveIcon + '"></span> '
                                + '<span>' + escape(vm.drive.title) + '</span> '
                                + '</div>';
                        }
                        // else

                        return '<div><span class="' + driveIcon + '"></span> '
                            + '<span>' + escape(item.name) + '</span> '
                            + '</div>';
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
        var buildDirectorysTree = function () {
            var rootDirectories = [];

            vm.directoriesDict = {};

            // initialize children array
            angular.forEach(vm.directories, function (directory) {
                directory.children = [];

                if (!directory.directory) {
                    // this is a root directory
                    rootDirectories.push(directory);
                }

                // push into directories dict
                vm.directoriesDict[directory.pk] = directory;
            });

            angular.forEach(vm.directories, function (directory) {
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
                vm.levelSortOrder++;
                // store levels by id
                vm.directoryLevelsById[obj.pk] = level;

                obj.levelSortOrder = vm.levelSortOrder;

                if (obj.children) {
                    generateTreeLevels(obj.children, level + 1);
                }
            });
        };

        $scope.$watch("vm.directories", function () {
            vm.levelSortOrder = 0;

            generateTreeLevels(buildDirectorysTree(), 0);
        }, true);

    });
})();
