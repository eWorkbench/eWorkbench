/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Scope stack view for picture view.
     */
    module.component('pictureView', {
        templateUrl: 'js/screens/picture/pictureView.html',
        controller: 'PictureViewController',
        controllerAs: 'vm',
        bindings: {
            'picture': '<'
        }
    });

    /**
     * Show pictures details only (e.g. for version-restore-dialog).
     */
    module.component('smallPictureView', {
        templateUrl: 'js/screens/picture/smallPictureView.html',
        controller: 'PictureViewController',
        controllerAs: 'vm',
        bindings: {
            'picture': '<',
            'readOnly': '<'
        }
    });

    /**
     * Picture Detail View Controller
     *
     * Displays the Pictures Detail View
     */
    module.controller('PictureViewController', function (
        $scope,
        $timeout,
        $q,
        gettextCatalog,
        toaster,
        PictureRestService,
        IconImagesService,
        PermissionService
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
             * Picture Icon
             * @type {string}
             */
            vm.pictureIcon = IconImagesService.mainElementIcons.picture;

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

            /**
             * The literally canvas api (set by the directive)
             * @type {}
             */
            vm.lcApi = null;

            /**
             * API for saving Picture cells
             * @type {null}
             */
            vm.pictureFormShapesApi = null;

            /**
             * The shapes of the picture
             * @type {{}}
             */
            vm.shapes = {
                shapes: null,
                width: null,
                height: null
            };

            /**
             * Whether or not there are unsaved changes on the canvas element
             * @type {boolean}
             */
            vm.canvasEditButtonVisible = false;

            /**
             * Whether the element is currently locked or not (determined by vm.onLock and vm.onUnlock)
             * @type {boolean}
             */
            vm.isLocked = false;

            updateProjectPks(vm.picture);

            /**
             * Wait for picture form shapes api to be initialized, so we can reset the canvasEditButtonVisible
             */
            var waitForApiListener = $scope.$watch("vm.pictureFormShapesApi", function (newVal, oldVal) {
                if (newVal != oldVal) {
                    vm.pictureFormShapesApi.loadShapes().then(
                        function () {
                            $timeout(function () {
                                // reset unsaved changes
                                vm.canvasEditButtonVisible = false;
                            });

                        }
                    );

                    // unregister watcher
                    waitForApiListener();
                }
            });
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
            if (vm.picture.deleted) {
                vm.readOnly = true;
            }

            return vm.readOnly || !PermissionService.has('object.edit', vm.picture);
        };

        /**
         * reset errors
         */
        vm.resetErrors = function () {
            vm.errors = {};
        };

        /**
         * Uploads the shape and the rendered image of the picture
         */
        vm.saveShapes = function () {
            return vm.pictureFormShapesApi.saveShapes();
        };

        /**
         * Save a picture via REST API as a full update
         */
        vm.savePicture = function () {
            vm.readOnly = true;
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // set projects
            vm.picture.projects = vm.projectPks;

            // update picture via rest api
            vm.picture.$update().then(
                function success (response) {
                    updateProjectPks(response);
                    vm.picture = response;
                    // worked
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
                    } else if (rejection.status === 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Task"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Saves a picture via REST API partial update
         * @param key
         * @param value
         */
        vm.savePicturePartial = function (key, value) {
            vm.readOnly = true;
            // always initialize with primary key
            var data = {
                pk: vm.picture.pk
            };

            data[key] = value;

            console.log('on before save: save contact partial');

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            PictureRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    vm.picture = response;
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
                        toaster.pop('error', gettextCatalog.getString("User storage limit was reached"));
                        d.reject(gettextCatalog.getString("User storage limit reached"));
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Picture"));
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
         * @param picture
         */
        var updateProjectPks = function (picture) {
            vm.projectPks.length = 0;
            if (picture.projects) {
                for (var i = 0; i < picture.projects.length; i++) {
                    vm.projectPks.push(picture.projects[i]);
                }
            }
        };
    });
})();
