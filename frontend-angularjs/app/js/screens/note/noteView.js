/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Scope stack view for note view.
     */
    module.component('noteView', {
        templateUrl: 'js/screens/note/noteView.html',
        controller: 'NoteViewController',
        controllerAs: 'vm',
        bindings: {
            'note': '<'
        }
    });

    /**
     * Small note view for dialogs
     */
    module.component('smallNoteView', {
        templateUrl: 'js/screens/note/smallNoteView.html',
        controller: 'NoteViewController',
        controllerAs: 'vm',
        bindings: {
            'note': '<',
            'readOnly': '<'
        }
    });

    /**
     * Note Detail View Controller
     *
     * Displays the Notes Detail View
     */
    module.controller('NoteViewController', function (
        $scope,
        $q,
        gettextCatalog,
        toaster,
        NoteRestService,
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
             * Note Icon
             * @type {string}
             */
            vm.noteIcon = IconImagesService.mainElementIcons.note;

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
             * Whether the element is currently locked or not (determined by vm.onLock and vm.onUnlock)
             * @type {boolean}
             */
            vm.isLocked = false;

            updateProjectPks(vm.note);
        };

        vm.resetErrors = function () {
            vm.errors = {};
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
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.note);
        };

        /**
         * Saves a note via REST API
         */
        vm.saveNote = function () {
            vm.readOnly = true;
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // set projects
            vm.note.projects = vm.projectPks;

            // update task via rest api
            vm.note.$update().then(
                function success (response) {
                    updateProjectPks(response);
                    // worked
                    vm.note = response;
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
         * Saves a note via REST API partial update
         * @param key
         * @param value
         */
        vm.saveNotePartial = function (key, value) {
            vm.readOnly = true;
            // always initialize with primary key
            var data = {
                pk: vm.note.pk
            };

            data[key] = value;

            console.log('on before save: save contact partial');

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            NoteRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    vm.note = response;
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
         * @param note
         */
        var updateProjectPks = function (note) {
            vm.projectPks.length = 0;
            if (note.projects) {
                for (var i = 0; i < note.projects.length; i++) {
                    vm.projectPks.push(note.projects[i]);
                }
            }
        };
    });
})();
