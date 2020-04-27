/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');


    /**
     * Scope stack view for labbook section filter grid.
     */
    module.component('labbookSectionGrid', {
        templateUrl: 'js/widgets/labbookSectionGrid/labbookSectionGrid.html',
        controller: 'labbookSectionGridController',
        controllerAs: 'vm',
        bindings: {
            sectionElement: '<',
            labbook: '<',
            labbookChildElements: '=',
            skipNextWebsocketRefresh: '='
        }
    });

    module.controller('labbookSectionGridController', function (
        $scope,
        $rootScope,
        $q,
        WorkbenchElementsTranslationsService,
        toaster,
        gettextCatalog,
        LabbookSectionsRestService,
        LabbookChildElementsRestService,
        PermissionService,
        IconImagesService,
        NoteRestService,
        pictureCreateModalService,
        selectFileWithPicker,
        FileRestService,
        GlobalErrorHandlerService,
        LabbookGridOptions,
        LabbookService
    ) {
        var vm = this;

        this.$onInit = function () {
            vm.recalculationInProgress = false;
            /**
             * Options for angular gridster
             **/
            vm.sectionGridsterOpts = LabbookGridOptions.getCommonGridsterOpts();
            vm.sectionGridsterOpts.resizable = {
                enabled: true,
                handles: ['e', 's', 'w', 'se', 'sw'],
                stop: function (event, $element, widget) {
                    vm.updateLabbookChildElements();
                }
            };
            vm.sectionGridsterOpts.draggable = {
                enabled: true,
                // the handler class needs to have a different name than the one in the section grid in
                // screens/labbook/labbookView.js so drag events only happen within the right grid
                handle: '.labbook-section-cell-move',
                stop: function (event, $element, widget) {
                    vm.updateLabbookChildElements();
                }
            };

            vm.mainElementIcons = IconImagesService.mainElementIcons;

            /**
             * watch for broadcasts of child elements being removed and remove them from the section
             */
            $scope.$on("section-remove-child-element", function (event, args) {
                var childElement = args.childElement;

                vm.recalculationInProgress = LabbookService.recalculatePositions(
                    vm.sectionChildElements,
                    childElement,
                    vm.updateLabbookChildElements
                );
                childElement.$delete().then(function () {
                    vm.getAllChildElements(vm.sectionElement.child_object_id);
                });
            });

            /**
             * Whether the element is currently locked or not (determined by vm.onLock and vm.onUnlock)
             * @type {boolean}
             */
            vm.isLocked = false;

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

            vm.sectionChildElementsLoaded = false;
            vm.noteIsRendering = false;

            /**
             * REST Service for Labbook Child Elements
             */
            vm.labbookChildElementRestService = LabbookChildElementsRestService(vm.labbook.pk);

            vm.getAllChildElements(vm.sectionElement.child_object_id);

            /**
             * watch for broadcasts of child elements being removed from this section
             * then remove the element from the current grid
             */
            $rootScope.$on("labbook-child-element-moved-from-section", function (event, args) {
                var removedChildElement = args.element;
                var updatedChildElements = [];

                vm.recalculationInProgress = LabbookService.recalculatePositions(
                    vm.sectionChildElements,
                    removedChildElement,
                    vm.updateLabbookChildElements
                );
                // loop over the child elements and remove the one that has been removed from this section
                angular.forEach(vm.sectionChildElements, function (childElement) {
                    if (childElement.pk !== removedChildElement.pk) {
                        updatedChildElements.push(childElement);
                    }
                });
                vm.sectionChildElements = updatedChildElements;
            });
        };

        /**
         * Updates positioning of ALL labbook child elements in this section grid via the REST API
         *
         * This is necessary, e.g., when a labbook child element is moved from one position to another position,
         * because movement of one element might cause movement of other elements
         */
        vm.updateLabbookChildElements = function () {
            /**
             * List of all child elements (collected in the for loop)
             *
             * Each object contains the primary key (pk) and the position (position_x/y, width/height) of the child
             * element
             * @type {Array}
             */
            var capturedChildElements = [];

            // collect the positioning of all child elements
            for (var i = 0; i < vm.sectionChildElements.length; i++) {
                capturedChildElements.push({
                    'pk': vm.sectionChildElements[i].pk,
                    'position_y': vm.sectionChildElements[i].position_y,
                    'position_x': vm.sectionChildElements[i].position_x,
                    'width': vm.sectionChildElements[i].width,
                    'height': vm.sectionChildElements[i].height
                });
            }

            vm.skipNextWebsocketRefresh = true;

            // call rest api
            return vm.labbookChildElementRestService.resource.updateAll(capturedChildElements).$promise.then(
                function success (response) {
                    // skip next websocket fresh for roughly 100 ms
                    setTimeout(function () {
                        vm.skipNextWebsocketRefresh = false;
                        vm.recalculationInProgress = false;
                    }, 100);
                },
                function error (rejection) {
                    // revert changes locally
                    vm.getAllChildElements(vm.sectionElement.child_object_id);
                    // skip next websocket fresh for roughly 100 ms
                    setTimeout(function () {
                        vm.skipNextWebsocketRefresh = false;
                    }, 100);

                    if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Permission Denied"),
                            gettextCatalog.getString("You do not have permissions to modify cells of a LabBook")
                        );
                    } else {
                        // Unknown error -> write our own error message
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Error"),
                            gettextCatalog.getString("Could not modify cells of LabBook")
                        );
                    }
                }
            );
        };

        /**
         * Checks whether the current user is allowed to create a new cell within the labbook
         * @returns {boolean}
         */
        vm.hasPermissionToAddNewModify = function () {
            return !vm.readOnly && PermissionService.has('object.edit', vm.labbook);
        };

        vm.refreshLabbookChildElements = function (element_id) {
            var filters = {};

            // check if a user filter is selected
            if (element_id && element_id.length > 0) {
                filters['section'] =  element_id;
            }

            vm.labbookChildElementRestService.query(filters).$promise.then(
                function success (response) {
                    // we can not simple overwrite vm.sectionChildElements, as the data is kept in a datastore/cache
                    // instead, we reset child elements array and then push all items from response into it
                    vm.sectionChildElements.length = 0;

                    // push the response into childElements
                    Array.prototype.push.apply(vm.sectionChildElements, response);
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to update Section"));
                }
            );
        };

        /**
         * Get All child elements and store the data and the actual elements in
         * - vm.sectionChildElements - dictionary that contains the actual child elements, such as note, picture, ...
         * @returns {promise}
         */
        vm.getAllChildElements = function (element_id) {
            var filters = {};

            // we are adding a filter here: ?section=<section.pk>
            if (element_id && element_id.length > 0) {
                filters['section'] =  element_id;
            }

            // this query uses the section filter so we only get child elements of the section from the api
            return vm.labbookChildElementRestService.query(filters).$promise.then(
                function success (response) {
                    vm.sectionChildElements = response;
                    vm.sectionChildElementsLoaded = true;
                }
            );
        };
    });
})();
