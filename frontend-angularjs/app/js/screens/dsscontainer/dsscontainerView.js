/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Scope stack view for dsscontainer view.
     */
    module.component('dsscontainerView', {
        templateUrl: 'js/screens/dsscontainer/dsscontainerView.html',
        controller: 'DSSContainerViewController',
        controllerAs: 'vm',
        bindings: {
            'dsscontainer': '<'
        }
    });

    /**
     * Show dsscontainer details only (e.g. for version-restore-dialog).
     */
    module.component('smallDSSContainerView', {
        templateUrl: 'js/screens/dsscontainer/smallDSSContainerView.html',
        controller: 'DSSContainerViewController',
        controllerAs: 'vm',
        bindings: {
            'dsscontainer': '<',
            'readOnly': '<'
        }
    });

    /**
     * DSS Container Detail View Controller
     *
     * Displays the DSS Container Detail View
     */
    module.controller('DSSContainerViewController', function (
        $scope,
        $q,
        $timeout,
        $uibModal,
        gettextCatalog,
        toaster,
        selectFileWithPicker,
        DSSContainerRestService,
        DSSFilesToImportRestService,
        WorkbenchElementChangesWebSocket,
        WorkbenchElementsTranslationsService,
        IconImagesService,
        PermissionService,
        $http,
        restApiUrl
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
            vm.dsscontainerIcon = IconImagesService.mainElementIcons.drive;

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * dsscontainer is in edit mode
             * @type {boolean}
             */
            vm.dsscontainerEditMode = false;

            /**
             * importList to upload a list of imports to a DSS Container
             */
            vm.importList = {};

            /**
             * Whether the element is currently locked or not (determined by vm.onLock and vm.onUnlock)
             * @type {boolean}
             */
            vm.isLocked = false;

            updateProjectPks(vm.dsscontainer);

            /**
             * Initialize WebSocket: Subscribe to changes on the websocket
             */
            var wsUnsubscribeFunction = WorkbenchElementChangesWebSocket.subscribe(
                'dsscontainer', vm.dsscontainer.pk, function onChange (jsonMessage) {
                    // this element has changed
                    if (jsonMessage['element_changed'] || jsonMessage['element_relations_changed']) {
                        // update the element
                        vm.dsscontainer.$getCached().then(function () {
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

            vm.loadDSSContainerHowToCmsText();
        };

        vm.loadDSSContainerHowToCmsText = function () {
            $http.get(restApiUrl + "cms/json/dss_container_detail_how_to/").then(
                function success (response) {
                    vm.cmsDSSContainerDetailHowTo = response.data;
                },
                function error (rejection) {
                    vm.cmsDSSContainerDetailHowTo = null;
                }
            );
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
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.dsscontainer);
        };

        /**
         * Saves a dsscontainer via REST API
         */
        vm.saveDSSContainer = function () {
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // set projects
            vm.dsscontainer.projects = vm.projectPks;

            // update dsscontainer via rest api
            vm.dsscontainer.$update().then(
                function success (response) {
                    updateProjectPks(response);
                    // worked
                    vm.dsscontainer = response;
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
                        toaster.pop('error', gettextCatalog.getString("Failed to update DSS Container"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            );

            return d.promise;
        };

        vm.tryParseJSON = function (jsonString) {
            try {
                var o = JSON.parse(jsonString);

                // Handle non-exception-throwing cases:
                // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
                // but... JSON.parse(null) returns null, and typeof null === "object",
                // so we must check for that, too. Thankfully, null is falsey, so this suffices:
                if (o && typeof o === "object") {
                    return o;
                }
            } catch (e) {
                console.log('not valid JSON', e)
            }

            return false;
        }

        /**
         * Button for uploading an import list
         */
        vm.parseImportList = function () {
            selectFileWithPicker().then(
                function fileListSelected (fileList) {
                    var fileContent = '';
                    var reader = new FileReader();

                    reader.addEventListener('load', function (event) {
                        fileContent = event.target.result;
                    });
                    reader.readAsText(fileList[0]);
                    reader.onload = function () {
                        if (vm.tryParseJSON(fileContent)) {
                            vm.importList = JSON.parse(fileContent)
                            vm.uploadImportList(vm.importList)
                        } else {
                            $timeout(function () {
                                vm.errors = {"importfile":["The file contents could not be parsed as valid json"]}
                            });
                        }
                    }
                }
            )
        };

        vm.uploadImportList = function (importList) {
            vm.errors = {};
            var d = $q.defer();

            DSSFilesToImportRestService.create(importList).$promise.then(
                function success (response) {
                    // worked - response.count is the count of paths that were added
                    toaster.pop('success', gettextCatalog.getString("Added " + response.count + " paths to the queue to be imported"));
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
                        toaster.pop('error', gettextCatalog.getString("Failed to upload Import File"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            );
        };

        /**
         * Saves a dsscontainer via REST API partial update
         * @param key
         * @param value
         */
        vm.saveDSSContainerPartial = function (key, value) {
            // always initialize with primary key
            var data = {
                pk: vm.dsscontainer.pk
            };

            data[key] = value;

            console.log('on before save: save DSSContainer partial');

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            DSSContainerRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    vm.dsscontainer = response;
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
                        toaster.pop('error', gettextCatalog.getString("Failed to update DSSContainer"));
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
         * @param dsscontainer
         */
        var updateProjectPks = function (dsscontainer) {
            vm.projectPks.length = 0;
            if (dsscontainer.projects) {
                for (var i = 0; i < dsscontainer.projects.length; i++) {
                    vm.projectPks.push(dsscontainer.projects[i]);
                }
            }
        };
    });
})();
