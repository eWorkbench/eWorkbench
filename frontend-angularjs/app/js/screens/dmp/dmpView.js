/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    module.component('dmpView', {
        templateUrl: 'js/screens/dmp/dmpView.html',
        controller: 'DmpViewController',
        controllerAs: 'vm',
        bindings: {
            dmp: '<'
        }
    });

    module.component('smallDmpView', {
        templateUrl: 'js/screens/dmp/smallDmpView.html',
        controller: 'DmpViewController',
        controllerAs: 'vm',
        bindings: {
            dmp: '<',
            readOnly: '<'
        }
    });

    /**
     * DMPs Edit Controller
     *
     * Displays a form for edit DMPs
     */
    module.controller('DmpViewController', function (
        $scope,
        $rootScope,
        $q,
        AuthRestService,
        DmpRestService,
        DmpRestServiceExport,
        DmpStateService,
        restApiUrl,
        FileSaver,
        Blob,
        gettextCatalog,
        toaster,
        IconImagesService,
        PermissionService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * States of the DMP
             * @type {object}
             */
            vm.dmpStates = DmpStateService.dmpStates;

            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * gets the correct icons
             */
            vm.editIcon = IconImagesService.mainActionIcons.edit;

            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * The currently logged in user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * DMP Icon
             * @type {{title: string, project: *}|*|Array|string}
             */
            vm.dmpIcon = IconImagesService.mainElementIcons.dmp;

            /**
             * Whether the element is currently locked or not (determined by vm.onLock and vm.onUnlock)
             * @type {boolean}
             */
            vm.isLocked = false;

            updateProjectPks(vm.dmp);
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
         * Updates a list of project pks
         * This is necessary as the list of PKs has a different reference,
         * and the angular $watchGroup does not allow
         * to watch for array changes
         * @param dmp
         */
        var updateProjectPks = function (dmp) {
            vm.projectPks.length = 0;
            if (dmp.projects) {
                for (var i = 0; i < dmp.projects.length; i++) {
                    vm.projectPks.push(dmp.projects[i]);
                }
            }
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.dmp) || (
                vm.dmp.status == 'FIN' && vm.currentUser.pk != vm.dmp.created_by.pk
            );
        };

        /**
         * reset errors
         */
        vm.resetErrors = function () {
            vm.errors = {};
        };

        /**
         * Saves a dmp via REST API
         */
        vm.saveDmp = function () {
            vm.readOnly = true;
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // set projects
            vm.dmp.projects = vm.projectPks;

            // update task via rest api
            vm.dmp.$update().then(
                function success (response) {
                    updateProjectPks(response);
                    // worked
                    vm.dmp = response;
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
                        toaster.pop('error', gettextCatalog.getString("Failed to update DMP"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Save a DMP via REST (patch)
         * @param key
         * @param value
         */
        vm.saveDmpPartial = function (key, value) {
            vm.readOnly = true;
            // always initialize with primary key
            var data = {
                'pk': vm.dmp.pk
            };

            var d = $q.defer();

            data[key] = value;

            vm.errors = {};

            DmpRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    vm.dmp = response;
                    // worked
                    d.resolve(response);
                },
                function error (rejection) {
                    console.log(rejection);
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
                        toaster.pop('error', gettextCatalog.getString("Failed to update DMP"));
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
         * Cancel Edit of DMP Form Data
         */
        vm.cancelEdit = function () {
            $scope.editDmpFormData.$setPristine();
            vm.dmp.$getCached();
        };

        /**
         * Save changes for DMP
         */
        vm.saveChanges = function () {
            var defer = $q.defer();

            vm.errors = {};
            vm.dmp.$update().then(
                function success (response) {
                    $scope.editDmpFormData.$setPristine();
                    updateProjectPks(response);
                    vm.dmp = response;
                    toaster.pop('success', gettextCatalog.getString("DMP updated"));
                    defer.resolve(response);
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to update DMP"));

                    vm.errors = rejection.data;

                    defer.reject(rejection);
                }
            );

            return defer.promise;
        };

        /**
         * Export a file
         * @param fileType - specify the type of the file (XML, HTML, TXT, PDF)
         * @param mimeType
         */
        vm.downloadFile = function (fileType, mimeType) {
            DmpRestServiceExport.export(vm.dmp.pk, fileType).then(function (response) {
                var data = new Blob([response.data], {type: mimeType + ';charset=utf-8'});

                FileSaver.saveAs(data, 'dmp_' + vm.dmp.pk + '.' + fileType);
            });
        };

        /**
         * Watch changes on the form and broadcast a detected change
         */
        $scope.$watch("editDmpFormData.$dirty", function (newValue, oldValue) {
            if (newValue) {
                $rootScope.$broadcast("change_detected");
            }
        });
    });
})();
