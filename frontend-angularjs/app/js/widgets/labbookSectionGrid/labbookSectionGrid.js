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
        LabbookGridOptions
    ) {
        var vm = this;

        this.$onInit = function () {
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
                var removedChildElementPk = args.element_id;
                var updatedChildElements = [];

                // loop over the child elements and remove the one that has been removed from this section
                angular.forEach(vm.sectionChildElements, function (childElement) {
                    if (childElement.pk !== removedChildElementPk) {
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

        /**
         * Add a new note at the specified position
         * This first creates a note via the Notes REST API, and then adds it to the section child elements
         * @param position
         */
        vm.addNewNote = function (position) {
            vm.noteIsRendering = true;
            var data = {
                'subject': gettextCatalog.getString("Title"),
                'content': gettextCatalog.getString("Write your text here..."),
                'projects': vm.labbook.projects
            };

            // 1. create a new note via REST API
            NoteRestService.create(data).$promise.then(
                function success (element) {
                    // 2. determine the position where the new element should go
                    var data = calculatePositionOfNewElement(position, 20, 7);

                    data['child_object_id'] = element.pk;
                    data['child_object_content_type'] = element.content_type;

                    addNewLabbookChildElement(data);
                },
                function error (rejection) {
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Error"), rejection.data.detail);
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Permission Denied"),
                            gettextCatalog.getString("You do not have permissions to create a new Note in this LabBook")
                        );
                    } else {
                        // Unknown error -> write our own error message
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Error"),
                            gettextCatalog.getString("Failed to create a new Note")
                        );
                    }
                    // if there is an error we need to set this false again anyways
                    vm.noteIsRendering = false;
                }
            );
        };

        /**
         * Add a new picture at the specified position
         * @param position the position (either "top" or "bottom")
         */
        vm.addNewPicture = function (position) {
            // create the picture create modal dialog and let the user fill in the details of the picture
            pictureCreateModalService.open({'projects': vm.labbook.projects}).result.then(
                function success (element) {
                    // 2. determine the position where the new element should go
                    var data = calculatePositionOfNewElement(position, 20, 7);

                    data['child_object_id'] = element.pk;
                    data['child_object_content_type'] = element.content_type;

                    addNewLabbookChildElement(data);
                },
                function cancel () {
                }
            );
        };

        /**
         * Add a new file at the specified position
         * Asks the user for a file to upload
         * @param position
         */
        vm.addNewFile = function (position) {
            var data = {
                'title': gettextCatalog.getString("New File"),
                'projects': vm.labbook.projects
            };

            // open file picker, and once a file is selected, upload it
            selectFileWithPicker().then(
                function success (file) {
                    data['path'] = file;
                    data['name'] = file[0].name;

                    // 1. create a new note via REST API
                    FileRestService.create(data).$promise.then(
                        function success (element) {
                            // 2. determine the position where the new element should go
                            var data = calculatePositionOfNewElement(position, 20, 7);

                            data['child_object_id'] = element.pk;
                            data['child_object_content_type'] = element.content_type;

                            addNewLabbookChildElement(data);
                        },
                        function error (rejection) {
                            if (rejection.status == 507) {
                                // handle insufficient storage error - occurs when user storage limit was reached
                                var rejectionMessage =
                                    GlobalErrorHandlerService.handleRestApiStorageError(rejection);

                                toaster.pop('error', rejectionMessage.toasterTitle, rejectionMessage.validationMessage);
                            } else if (rejection.data && rejection.data.non_field_errors) {
                                // report with errors
                                toaster.pop('error', gettextCatalog.getString("Upload failed"),
                                    rejection.data.non_field_errors.join(", "));
                            } else {
                                toaster.pop('error', gettextCatalog.getString("Upload failed"));
                            }
                        }
                    );
                }
            );
        };

        /**
         * Calculates the position of the element when the element is added
         * E.g., if you want to add an element at the bottom of the grid, we need to calculate the x and y position
         * @param position [string] the position of the new element, either top or bottom
         */
        var calculatePositionOfNewElement = function (position, newWidth, newHeight) {
            var el = null,
                i = 0;

            if (position == 'top') {
                // move all child elements to the bottom by newHeight
                for (i = 0; i < vm.sectionChildElements.length; i++) {
                    el = vm.sectionChildElements[i];

                    el.position_y += newHeight;
                }

                return {
                    'height': newHeight,
                    'width': newWidth,
                    'position_x': 0,
                    'position_y': 0
                };
            } else if (position == 'bottom') {
                // determine the maximum position_y + the height of this item
                var maxY = 0;

                for (i = 0; i < vm.sectionChildElements.length; i++) {
                    el = vm.sectionChildElements[i];

                    if (el.position_y + el.height > maxY) {
                        maxY = el.position_y + el.height;
                    }
                }

                return {
                    'height': newHeight,
                    'width': newWidth,
                    'position_x': 0,
                    'position_y': maxY
                };
            }

            // if we got so far, we do not know how to handle position (probably an error by the dev)
            console.error("Unknown position " + position);

            return {};
        };

        /**
         * Add a new labbook child element via REST API
         * @param item
         */
        var addNewLabbookChildElement = function (item) {
            // skipping the next websocket refresh, so the labbook top level grid
            // doesn't show this element there for a short time
            vm.skipNextWebsocketRefresh = true;

            // 1. create a new labbook child element
            return vm.labbookChildElementRestService.create(item).$promise.then(
                function success (response) {
                    // 2. add the element to the section
                    addChildElementToSection(response);
                    setTimeout(function () {
                        vm.skipNextWebsocketRefresh = false;
                    }, 100);
                },
                function error (rejection) {
                    setTimeout(function () {
                        vm.skipNextWebsocketRefresh = false;
                    }, 100);
                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Error"), rejection.data.detail);
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Permission Denied"),
                            gettextCatalog.getString("You do not have permissions to add an element in this LabBook")
                        );
                    } else {
                        // Unknown error -> write our own error message
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Error"),
                            gettextCatalog.getString("Could not add new cell")
                        );
                    }
                    // in any case we need to reload the labbook details
                    vm.refreshLabbookChildElements();
                }
            );
        };

        /**
         * Add child element to the section via REST API
         * @param item
         */
        var addChildElementToSection = function (item) {
            // add the elements pk to child elements
            vm.sectionElement.child_object.child_elements.push(item.pk);
            var data = {
                'pk': vm.sectionElement.child_object.pk,
                'child_elements': vm.sectionElement.child_object.child_elements
            };

            // 1. update the child elements of the section
            LabbookSectionsRestService.updatePartial(data).$promise.then(
                function success (response) {
                    // 2. trigger removal from the labbook grid
                    $rootScope.$emit("labbook-child-element-added-to-section", {element_id: item.pk});
                    toaster.pop('success', gettextCatalog.getString("Cell added"));
                    vm.updateLabbookChildElements();
                },
                function error (rejection) {
                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Error"), rejection.data.detail);
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Permission Denied"),
                            gettextCatalog.getString("You do not have permissions to add an element in this LabBook")
                        );
                    } else {
                        // Unknown error -> write our own error message
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Error"),
                            gettextCatalog.getString("Could not add new cell")
                        );
                    }
                }
            ).finally(function () {
                vm.noteIsRendering = false;
            });
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
