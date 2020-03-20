/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Scope stack view for drive view.
     */
    module.component('driveView', {
        templateUrl: 'js/screens/drive/driveView.html',
        controller: 'DriveViewController',
        controllerAs: 'vm',
        bindings: {
            'drive': '<'
        }
    });

    /**
     * Drive Detail View Controller
     *
     * Displays the Drives Detail View
     */
    module.controller('DriveViewController', function (
        $scope,
        $q,
        gettextCatalog,
        toaster,
        DriveRestService,
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
             * gets the correct icons
             */
            vm.editIcon = IconImagesService.mainActionIcons.edit;
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];
            updateProjectPks(vm.drive);

            /**
             * Whether or not meta data should be collapsed
             * @type {boolean}
             */
            vm.metaDataCollapsed = true;
        };

        /**
         * Toggles visibility of meta data
         * Default setting (closed or open) is determined in `init()`
         */
        vm.toggleMetaDataVisibility = function () {
            vm.metaDataCollapsed = !vm.metaDataCollapsed;
        };

        /**
         * reset errors
         */
        vm.resetErrors = function () {
            vm.errors = {};
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly;
        };

        /**
         * Saves a drive via REST API
         */
        vm.saveDrive = function () {
            vm.readOnly = true;
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // set projects
            vm.drive.projects = vm.projectPks;

            // update task via rest api
            vm.drive.$update().then(
                function success (response) {
                    updateProjectPks(response);
                    // worked
                    vm.drive = response;
                    d.resolve();
                },
                function error (rejection) {
                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        d.reject(rejection.data);
                        vm.errors = rejection.data;
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Comment"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Saves a drive via REST API partial update
         * @param key
         * @param value
         */
        vm.saveDrivePartial = function (key, value) {
            vm.readOnly = true;
            // always initialize with primary key
            var data = {
                pk: vm.drive.pk
            };

            data[key] = value;

            console.log('on before save: save contact partial');

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            DriveRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    vm.drive = response;
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
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Comment"));
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
         * Updates a list of project pks
         * This is necessary as the list of PKs has a different reference,
         * and the angular $watchGroup does not allow
         * to watch for array changes
         * @param drive
         */
        var updateProjectPks = function (drive) {
            vm.projectPks.length = 0;
            if (drive.projects) {
                for (var i = 0; i < drive.projects.length; i++) {
                    vm.projectPks.push(drive.projects[i]);
                }
            }
        };

    });
})();
