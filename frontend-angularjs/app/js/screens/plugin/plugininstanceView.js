/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Scope stack view for plugininstance view.
     */
    module.component('plugininstanceView', {
        templateUrl: 'js/screens/plugin/plugininstanceView.html',
        controller: 'PlugininstanceViewController',
        controllerAs: 'vm',
        bindings: {
            'plugininstance': '<'
        }
    });

    /**
     * Show plugininstance details only (e.g. for version-restore-dialog).
     */
    module.component('smallPlugininstanceView', {
        templateUrl: 'js/screens/plugin/smallPlugininstanceView.html',
        controller: 'PlugininstanceViewController',
        controllerAs: 'vm',
        bindings: {
            'plugininstance': '<',
            'readOnly': '<'
        }
    });

    /**
     * Plugin Instance Detail View Controller
     *
     * Displays the Plugin Instance Detail View
     */
    module.controller('PlugininstanceViewController', function (
        $scope,
        $q,
        $timeout,
        $uibModal,
        gettextCatalog,
        toaster,
        newPluginSelectionModalService,
        PlugininstanceRestService,
        WorkbenchElementChangesWebSocket,
        WorkbenchElementsTranslationsService,
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
             * gets the correct icons
             */
            vm.editIcon = IconImagesService.mainActionIcons.edit;
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;
            vm.downloadIcon = IconImagesService.mainActionIcons.export;
            vm.pluginIcon = IconImagesService.mainElementIcons.plugininstance;

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * plugininstance is in edit mode
             * @type {boolean}
             */
            vm.plugininstanceEditMode = false;

            /**
             * Whether the element is currently locked or not (determined by vm.onLock and vm.onUnlock)
             * @type {boolean}
             */
            vm.isLocked = false;

            updateProjectPks(vm.plugininstance);

            /**
             * Initialize WebSocket: Subscribe to changes on the websocket
             */
            var wsUnsubscribeFunction = WorkbenchElementChangesWebSocket.subscribe(
                'plugininstance', vm.plugininstance.pk, function onChange (jsonMessage) {
                    // this element has changed
                    if (jsonMessage['element_changed'] || jsonMessage['element_relations_changed']) {
                        // update the element
                        vm.plugininstance.$getCached().then(
                            vm.editPlugininstance(false)
                        ).then(function () {
                            $timeout(function () {
                                // reset unsaved changes
                                vm.hasUnsavedChanges = false;
                                vm.titleHasUnsavedChanges = false;
                            })
                        });
                    }

                    // lock status of this element has changed
                    if (jsonMessage['element_lock_changed']) {
                        vm.lockStatus = jsonMessage['element_lock_changed'];
                    }
                }
            );

            $scope.$on("$destroy", function () {
                wsUnsubscribeFunction();
            });

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
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.plugininstance);
        };

        /**
         * open a modal dialog to display the plugin details
         */
        vm.showPluginDetails = function () {
            newPluginSelectionModalService.open('','', 'plugindetails', vm.plugininstance.plugin_details, true)
                .result.then(
                    function success (data) {
                        vm.addNewPlugininstance(data.location, data.section, data.selectedPluginPk);
                    },
                    function cancel () {
                    }
                )
        }

        /**
         * set a flag to toggle between showing the picture representation of
         * the Plugininstance-Childelement or the 3rd-party editor in an iframe
         * (also see plugininstanceView.html in the App-section)
         */
        vm.editPlugininstance = function (status) {
            // do not allow editing if this element is readonly
            if (vm.isReadOnly()) {
                return;
            }
            vm.plugininstanceEditMode = status;
        };

        /**
         * Saves a plugininstance via REST API
         */
        vm.savePlugininstance = function () {
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // set projects
            vm.plugininstance.projects = vm.projectPks;

            // update plugininstance via rest api
            vm.plugininstance.$update().then(
                function success (response) {
                    updateProjectPks(response);
                    // worked
                    vm.plugininstance = response;
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
            );

            return d.promise;
        };

        /**
         * Saves a plugininstance via REST API partial update
         * @param key
         * @param value
         */
        vm.savePlugininstancePartial = function (key, value) {
            // always initialize with primary key
            var data = {
                pk: vm.plugininstance.pk
            };

            data[key] = value;

            console.log('on before save: save contact partial');

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            PlugininstanceRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    vm.plugininstance = response;
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
            );

            return d.promise;
        };

        /**
         * Updates a list of project pks
         * This is necessary as the list of PKs has a different reference,
         * and the angular $watchGroup does not allow
         * to watch for array changes
         * @param plugininstance
         */
        var updateProjectPks = function (plugininstance) {
            vm.projectPks.length = 0;
            if (plugininstance.projects) {
                for (var i = 0; i < plugininstance.projects.length; i++) {
                    vm.projectPks.push(plugininstance.projects[i]);
                }
            }
        };
    });
})();
