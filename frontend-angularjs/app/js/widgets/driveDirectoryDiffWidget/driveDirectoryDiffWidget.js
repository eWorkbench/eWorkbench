/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('driveDirectoryDiffWidget', function () {
        return {
            restrict: 'E',
            controller: 'DriveDirectoryDiffWidgetController',
            templateUrl: 'js/widgets/driveDirectoryDiffWidget/driveDirectoryDiffWidget.html',
            scope: {
                leftObjStr: '@',
                rightObjStr: '@'
            },
            controllerAs: 'vm',
            bindToController: true
        };
    });

    module.controller('DriveDirectoryDiffWidgetController', function (
        $scope,
        gettextCatalog
    ) {
        var vm = this;

        /**
         * The right object that needs to be compared with the left object
         * @type {}
         */
        vm.rightObj = null;

        /**
         * Right object indexed by primary key
         * @type {{}}
         */
        vm.rightObjByPk = {};

        /**
         * The left object that needs to be compared with the right object
         * @type {null}
         */
        vm.leftObj = null;

        /**
         * Left object indexed by primary key
         * @type {{}}
         */
        vm.leftObjByPk = {};

        /**
         * All objects by primary key
         * @type {{}}
         */
        vm.allObjByPk = {};

        /**
         * Differences between the left and the right object
         * @type {Array}
         */
        vm.diffs = [];

        /**
         * convert the left object string (json) into an object
         */
        $scope.$watch("vm.leftObjStr", function (newVal, oldVal) {
            // parse json
            vm.leftObj = angular.fromJson(vm.leftObjStr);

            vm.leftObjByPk = {};

            // build dictionary by primary key
            for (var i = 0; i < vm.leftObj.length; i++) {
                vm.leftObjByPk[vm.leftObj[i].pk] = vm.leftObj[i];
            }
        });

        /**
         * convert the right object string (json) into an object
         */
        $scope.$watch("vm.rightObjStr", function (newVal, oldVal) {
            // parse json
            vm.rightObj = angular.fromJson(vm.rightObjStr);

            vm.rightObjByPk = {};

            // build dictionary by primary key
            for (var i = 0; i < vm.rightObj.length; i++) {
                vm.rightObjByPk[vm.rightObj[i].pk] = vm.rightObj[i];
            }
        });

        /**
         * Watch left and right object, and compare them if they change
         */
        $scope.$watchGroup(["vm.rightObj", "vm.leftObj"], function () {
            // reset diffs
            vm.diffs = [];

            var i = 0,
                pk = null;

            // collect allObjByPk
            vm.allObjByPk = {};
            for (i = 0; i < vm.leftObj.length; i++) {
                vm.allObjByPk[vm.leftObj[i].pk] = vm.leftObj[i].fields;
            }

            for (i = 0; i < vm.rightObj.length; i++) {
                vm.allObjByPk[vm.rightObj[i].pk] = vm.rightObj[i].fields;
            }

            // compare keys of left and right object and determine what has been inserted or deleted
            var leftKeys = Object.keys(vm.leftObjByPk);
            var rightKeys = Object.keys(vm.rightObjByPk);
            var insertedItems = rightKeys.diff(leftKeys);
            var removedItems = leftKeys.diff(rightKeys);
            var commonItems = rightKeys.intersection(leftKeys);

            for (i = 0; i < insertedItems.length; i++) {
                vm.diffs.push({
                    'inserted': true,
                    'item': vm.rightObjByPk[insertedItems[i]].fields
                });
            }

            for (i = 0; i < removedItems.length; i++) {
                vm.diffs.push({
                    'deleted': true,
                    'item': vm.leftObjByPk[removedItems[i]].fields
                });
            }

            // compare title and parent directory of common items
            for (i = 0; i < commonItems.length; i++) {
                pk = commonItems[i];

                // compare title of left and right obj
                if (vm.leftObjByPk[pk].fields.title != vm.rightObjByPk[pk].fields.title) {
                    vm.diffs.push({
                        'renamed': true,
                        'old': vm.leftObjByPk[pk].fields,
                        'new': vm.rightObjByPk[pk].fields
                    });
                }

                var entry = {};

                // legacy match for parent_directory
                if (vm.leftObjByPk[pk].fields.parent_directory != vm.rightObjByPk[pk].fields.parent_directory) {
                    entry = {
                        'moved': true,
                        'old': vm.leftObjByPk[pk].fields,
                        'oldParentTitle': gettextCatalog.getString('Unknown Directory'),
                        'new': vm.rightObjByPk[pk].fields,
                        'newParentTitle': gettextCatalog.getString('Unknown Directory')
                    };

                    if (!entry.old.parent_directory) {
                        // root directory
                        entry.oldParentTitle = gettextCatalog.getString('Root');
                    } else if (vm.allObjByPk[entry.old.parent_directory]) {
                        entry.oldParentTitle = vm.allObjByPk[entry.old.parent_directory].title;
                    }

                    if (!entry.new.parent_directory) {
                        entry.newParentTitle = gettextCatalog.getString('Root');
                    } else if (vm.allObjByPk[entry.new.parent_directory]) {
                        entry.newParentTitle = vm.allObjByPk[entry.new.parent_directory].title;
                    }

                    // push this change into our diffs array
                    vm.diffs.push(entry);
                }

                // new match for parent directory (variable was renamed from parent_directory to directory)
                if (vm.leftObjByPk[pk].fields.directory != vm.rightObjByPk[pk].fields.directory) {
                    entry = {
                        'moved': true,
                        'old': vm.leftObjByPk[pk].fields,
                        'oldParentTitle': gettextCatalog.getString('Unknown Directory'),
                        'new': vm.rightObjByPk[pk].fields,
                        'newParentTitle': gettextCatalog.getString('Unknown Directory')
                    };

                    if (!entry.old.directory) {
                        // root directory
                        entry.oldParentTitle = gettextCatalog.getString('Root');
                    } else if (vm.allObjByPk[entry.old.directory]) {
                        entry.oldParentTitle = vm.allObjByPk[entry.old.directory].name;
                    }

                    if (!entry.new.directory) {
                        entry.newParentTitle = gettextCatalog.getString('Root');
                    } else if (vm.allObjByPk[entry.new.directory]) {
                        entry.newParentTitle = vm.allObjByPk[entry.new.directory].name;
                    }

                    // push this change into our diffs array
                    vm.diffs.push(entry);
                }
            }

        });
    });
})();
