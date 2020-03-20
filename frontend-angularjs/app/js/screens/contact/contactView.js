/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Show and Edit Contact View
     */
    module.component('contactView', {
        templateUrl: 'js/screens/contact/contactView.html',
        controller: 'ContactViewController',
        controllerAs: 'vm',
        bindings: {
            'contact': '<'
        }
    });

    /**
     * Show and Edit Contact View
     */
    module.component('smallContactView', {
        templateUrl: 'js/screens/contact/smallContactView.html',
        controller: 'ContactViewController',
        controllerAs: 'vm',
        bindings: {
            'contact': '<',
            'readOnly': '<'
        }
    });

    /**
     * Contact Detail View Controller
     *
     * Displays the Contact Detail View
     */
    module.controller('ContactViewController', function (
        $scope,
        $q,
        $log,
        gettextCatalog,
        toaster,
        ContactRestService,
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
             * Contact Icon
             * @type {string}
             */
            vm.contactIcon = IconImagesService.mainElementIcons.contact;

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
            updateProjectPks(vm.contact);
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly || !PermissionService.has('object.edit', vm.contact);
        };

        /**
         * reset errors
         */
        vm.resetErrors = function () {
            vm.errors = {};
        };

        /**
         * Save a contact via REST API as a full update
         */
        vm.saveContact = function () {
            vm.readOnly = true;
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // set projects
            vm.contact.projects = vm.projectPks;

            vm.contact.$update().then(
                function success (response) {
                    updateProjectPks(response);
                    // worked
                    vm.contact = response;
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
                        toaster.pop('error', gettextCatalog.getString("Failed to update Contact"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Saves a contact via REST API partial update
         * @param key
         * @param value
         */
        vm.saveContactPartial = function (key, value) {
            vm.readOnly = true;
            // always initialize with primary key
            var data = {
                pk: vm.contact.pk
            };

            data[key] = value;

            console.log('on before save: save contact partial');

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            ContactRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    vm.contact = response;
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
                        toaster.pop('error', gettextCatalog.getString("Failed to update Contact"));
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
         * This is necessary as the list of PKs has a different reference, and the angular $watchGroup does not allow
         * to watch for array changes
         * @param contact
         */
        var updateProjectPks = function (contact) {
            vm.projectPks.length = 0;
            if (contact.projects) {
                for (var i = 0; i < contact.projects.length; i++) {
                    vm.projectPks.push(contact.projects[i]);
                }
            }
        };

    });
})();
