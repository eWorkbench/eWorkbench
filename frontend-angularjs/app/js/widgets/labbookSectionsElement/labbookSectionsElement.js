/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('labbookSectionsElementWidget', function () {
        return {
            templateUrl: 'js/widgets/labbookSectionsElement/labbookSectionsElement.html',
            controller: 'LabbookSectionsElementController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                sectionElement: '=',
                labbookChildElements: '=',
                labbook: '=',
                skipNextWebsocketRefresh: "="
            },
            link: function (scope, sectionElement, attrs) {
                scope.domElement = jQuery(sectionElement);
            }
        }
    });

    /**
     * Controller for labbookSectionsElementWidget
     */
    module.controller('LabbookSectionsElementController', function (
        $rootScope,
        $scope,
        $q,
        $timeout,
        AuthRestService,
        ElementLockRestService,
        IconImagesService,
        PermissionService,
        WorkbenchElementChangesWebSocket,
        WorkbenchElementsTranslationsService,
        confirmDialogWidget,
        gettextCatalog,
        toaster,
        LabbookSectionsRestService,
        labbookSectionDeleteModalService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {

            vm.icons = IconImagesService.mainActionIcons;

            vm.showCellMove = false;

            vm.sectionIsOpen = false;

            vm.edit  = false;

            /**
             * Rest service of the element
             * @type {null}
             */
            vm.elementRestService = null;

            /**
             * Whether the content of current element has unsaved changes (triggered by editable select list)
             * @type {boolean}
             */
            vm.hasUnsavedChanges = false;

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            vm.lockStatus = null;
            vm.latestVersion = vm.sectionElement.version_number;

            var baseContentType = vm.sectionElement.child_object_content_type_model;
            var modelName = WorkbenchElementsTranslationsService.contentTypeToModelName[baseContentType].toLowerCase();

            vm.elementLockService = ElementLockRestService(modelName, vm.sectionElement.child_object_id);

            /**
             * Initialize WebSocket: Subscribe to changes on the websocket
             */
            var wsUnsubscribeFunction = WorkbenchElementChangesWebSocket.subscribe(
                modelName, vm.sectionElement.child_object_id, function onChange (jsonMessage) {
                    // this element has changed
                    if (jsonMessage['element_changed'] || jsonMessage['element_relations_changed']) {
                        // update the element
                        vm.sectionElement.$getCached().then(initElement).then(function () {
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

            initElement();

            $scope.$on("$destroy", function () {
                wsUnsubscribeFunction();
            });
        };

        /**
         * determine contentType, rest service, title, etc... of the element
         */
        var initElement = function () {
            console.log("Element has changed!");

            vm.childElement = vm.sectionElement.child_object;

            $timeout(function () {
                initElementLockWatcher();
            });

        };

        var initElementLockWatcher = function () {
            /**
             * Watch for the change_detected message, which is triggered by input fields
             */
            $scope.$watch("vm.hasUnsavedChanges", function (newVal, oldVal) {
                if (newVal != oldVal && oldVal != null) {
                    // try to lock the element (it might not work though)
                    vm.elementLockService.lock();
                    // ToDo: Handle errors (e.g., with a modal dialog)
                }
            });
        };

        // opens the section grid
        vm.openSection = function () {
            vm.sectionIsOpen = true;
            $rootScope.$broadcast("another-section-grid-opens", {
                controller: vm
            });
        };

        // closes the section grid
        vm.closeSection = function () {
            vm.sectionIsOpen = false;
        };

        /**
         * Closes the section when another section opens
         */
        $rootScope.$on("another-section-grid-opens", function (event, args) {
            if (vm != args.controller) {
                vm.closeSection();
            }
        });

        /**
         * Whether this element is readonly or not
         * @returns {boolean}
         */
        vm.isReadonly = function () {
            if (vm.lockStatus && vm.lockStatus.locked &&
                vm.lockStatus['lock_details']['locked_by'].pk != vm.currentUser.pk) {
                return true;
            }

            return !PermissionService.has('object.edit', vm.childElement);
        };

        /**
         * On Mouse Enter show the movement and delete buttons
         */
        vm.onMouseEnter = function () {
            vm.showCellMove = true;
        };

        /**
         * On Mouse Leave hide the menu icons
         */
        vm.onMouseLeave = function () {
            vm.showCellMove = false;
        };

        /**
         * Opens the section delete modal
         */
        vm.deleteSection = function () {
            // open the modal dialog
            labbookSectionDeleteModalService.open(vm.childElement);
        };

        /**
         * Closes the section when a new element is added to the top level labbook grid as the item would
         * also falsely show up in the section grid
         */
        $rootScope.$on("labbook-child-element-added-to-labbook", function () {
            vm.closeSection();
        });

        /**
         * Saves Changes for the Labbook section element via REST API (using update)
         *
         * @returns {promise}
         */
        vm.save = function () {
            vm.errors = {};
            vm.isSaving = true;

            var d = $q.defer();

            var data = {
                'pk': vm.childElement.pk,
                'date': vm.childElement.date,
                'title': vm.childElement.title,
                'projects': vm.childElement.projects
            };

            // save the data we collected via a update rest api call
            LabbookSectionsRestService.update(data).$promise.then(
                function success (response) {
                    vm.childElement = response;
                    d.resolve(vm.childElement);

                    vm.isSaving = false;
                    vm.hasUnsavedChanges = false;
                },
                function error (rejection) {
                    vm.errors = rejection.data;

                    if (rejection.data.non_field_errors) {
                        toaster.pop('error',
                            gettextCatalog.getString("Error"),
                            rejection.data.non_field_errors.join(", ")
                        );
                        d.reject(rejection.data.non_field_errors);
                    } else {
                        toaster.pop('error', gettextCatalog.getString("Failed to save"));
                        d.reject(rejection.data);
                    }

                    vm.isSaving = false;
                }
            );

            return d.promise;
        };
    });
})();
