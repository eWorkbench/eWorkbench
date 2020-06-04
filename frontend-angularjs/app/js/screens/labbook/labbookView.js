/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Scope stack view for labbook view.
     */
    module.component('labbookView', {
        templateUrl: 'js/screens/labbook/labbookView.html',
        controller: 'LabbookViewController',
        controllerAs: 'vm',
        bindings: {
            'labbook': '<'
        }
    });

    /**
     * Small LabBook view, e.g. for the version-restore dialog.
     */
    module.component('smallLabbookView', {
        templateUrl: 'js/screens/labbook/smallLabbookView.html',
        controller: 'LabbookViewController',
        controllerAs: 'vm',
        bindings: {
            'labbook': '<',
            'readOnly': '<'
        }
    });

    module.service('labbookImportInProgressService', function () {
        "ngInject";

        var importInProgress = false;

        var service = {};

        service.setTrue = function () {
            importInProgress = true;
        };

        service.setFalse = function () {
            importInProgress = false;
        };

        service.checkForImportInProgress = function () {
            return importInProgress;
        };

        return service;
    });

    /**
     * Register a transition that checks for unsaved changes, and notifies the user on unsaved changes
     */
    module.run(function (
        $rootScope,
        $transitions,
        $uibModal,
        gettextCatalog,
        labbookImportInProgressService
    ) {
        "ngInject";

        /**
         * Add a listener to the before unload event of the browser. See
         * https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
         * for details
         */
        window.addEventListener('beforeunload', function (event) {
            if (labbookImportInProgressService.checkForImportInProgress()) {
                event.returnValue = gettextCatalog.getString(
                    "The LabBook Import is still in process. Are you sure you want to leave this page?"
                );

                return event.returnValue;
            }

            return undefined;
        });

        /**
         * Listen to all transitions
         * If there are unsaved changes, ask the user if they really want to leave
         */
        $transitions.onBefore({}, function (trans) {
            // check for unsaved changes, and then cancel the transition
            if (labbookImportInProgressService.checkForImportInProgress()) {
                // tell the user about unsaved changes, and let the user decide
                var modalInstance = $uibModal.open({
                    templateUrl: 'js/screens/labbook/importInProgress.html',
                    controller: function ($scope, $uibModalInstance) {
                        "ngInject";

                        $scope.dismiss = function () {
                            $uibModalInstance.dismiss();
                        };

                        $scope.okay = function () {
                            $uibModalInstance.close();
                        };
                    }
                });

                console.error("Canceling transition, import in progress!");

                // wait for the result of the modal dialog
                return modalInstance.result.then(
                    function okay () {
                        return true; // user clicked okay -> proceed to next page
                    },
                    function dismiss () {
                        return false; // user clicked cancel -> do not proceed to next page
                    }
                );
            }

            return true;
        });
    });


    /**
     * Labbook Detail View Controller
     *
     * Displays the Labbooks Detail View
     */
    module.controller('LabbookViewController', function (
        $scope,
        $rootScope,
        $http,
        $uibModal,
        $window,
        $q,
        $timeout,
        gettextCatalog,
        selectFileWithPicker,
        toaster,
        FileRestService,
        GlobalErrorHandlerService,
        IconImagesService,
        ProjectRestService,
        LabbookRestService,
        LabbookChildElementsRestService,
        NoteRestService,
        PictureRestService,
        WorkbenchElementChangesWebSocket,
        pictureCreateModalService,
        fileCreateModalService,
        newElementModalService,
        PermissionService,
        WorkbenchElementsTranslationsService,
        LabbookSectionsRestService,
        CalendarConfigurationService,
        LabbookGridOptions,
        LabbookService,
        labbookImportInProgressService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.recalculationInProgress = false;
            /**
             * REST Service for Labbook Child Elements
             */
            vm.labbookChildElementRestService = LabbookChildElementsRestService(vm.labbook.pk);

            /**
             * Whether or not to skip the next websocket refresh message (e.g.,
             * because we just did a put request ourselfs)
             * @type {boolean}
             */
            vm.skipNextWebsocketRefresh = false;

            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * Labbook Icon
             * @type {string}
             */
            vm.labbookIcon = IconImagesService.mainElementIcons.labbook;

            vm.mainElementIcons = IconImagesService.mainElementIcons;

            /**
             * gets the correct icons
             */
            vm.editIcon = IconImagesService.mainActionIcons.edit;
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * All child elements of the current labbook (such as notes, pictures, files)
             * @type {{}}
             */
            vm.childElements = {};

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * Whether or not meta data should be collapsed
             * @type {boolean}
             */
            vm.metaDataCollapsed = false;

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

            vm.noteIsRendering = false;

            vm.sectionIsRendering = false;

            vm.sectionFilterGrid = false;

            /**
             * Default placement position for new elements
             */
            vm.defaultPlacement = 'bottom';

            /**
             * Initialize WebSocket: Subscribe to changes on the websocket
             */
            var wsUnsubscribeFunction = WorkbenchElementChangesWebSocket.subscribe(
                "labbook", vm.labbook.pk, function onChange (jsonMessage) {
                    if (jsonMessage['labbook_child_element_changed']) {
                        if (vm.skipNextWebsocketRefresh) {
                            // skip
                            return;
                        }

                        // element has changed, update child elements
                        vm.refreshLabbookChildElements();
                    }
                }
            );

            $scope.$on("$destroy", function () {
                wsUnsubscribeFunction();
            });

            /**
             * Options for angular gridster
             **/
            vm.gridsterOpts = LabbookGridOptions.getCommonGridsterOpts();
            vm.gridsterOpts.resizable = {
                enabled: true,
                handles: ['e', 's', 'w', 'se', 'sw'],
                stop: function (event, $element, widget) {
                    vm.updateLabbookChildElements(vm.childElements);
                }
            };
            vm.gridsterOpts.draggable = {
                enabled: true,
                // the handler class needs to have a different name than the one in the section grid in
                // widgets/labbookSectionGrid/labbookSectionGrid.js so drag events only happen within the right grid
                handle: '.labbook-cell-move',
                stop: function (event, $element, widget) {
                    vm.updateLabbookChildElements(vm.childElements);
                }
            };

            /**
             * watch for broadcasts of child elements being removed
             */
            $scope.$on("labbook-remove-child-element", function (event, args) {
                var childElement = args.childElement;

                vm.recalculationInProgress = LabbookService.recalculatePositions(
                    vm.childElements,
                    childElement,
                    vm.updateLabbookChildElements
                );
                childElement.$delete().then(function () {
                    vm.getAllChildElements();
                });
            });

            /**
             * watch for broadcasts of all child elements of a section being removed
             * this is triggered when a section element is deleted and the user chooses to
             * "Remove all child elements from the Labbook"
             */
            $rootScope.$on("labbook-remove-all-section-child-elements", function (event, args) {
                var childElementPks = args.section.child_elements;

                // remove all child elements of the section fom the labbook
                for (var i = 0; i < childElementPks.length; i++) {
                    vm.labbookChildElementRestService.delete({pk: childElementPks[i]}).$promise.then(
                        function success (response) {
                        },
                        function error (rejection) {
                            /**
                             * Handle errors (Validation error, Permission error, unknown error)
                             */
                            if (rejection && rejection.data) {
                                // Validation error - an error message is provided by the api
                                console.log(rejection);
                                toaster.pop('error', gettextCatalog.getString("Error"), rejection.data.detail);
                            } else if (rejection.status === 403) {
                                // Permission denied -> write our own error message
                                toaster.pop('error', gettextCatalog.getString("Permission Denied"),
                                    gettextCatalog.getString("You do not have permissions to remove " +
                                        "an element in this LabBook")
                                );
                            } else {
                                // Unknown error -> write our own error message
                                console.log(rejection);
                                toaster.pop('error', gettextCatalog.getString("Error"),
                                    gettextCatalog.getString("Could not remove element")
                                );
                            }
                        }
                    );
                }
                // now remove the section element from the labbook
                vm.removeSectionElement(args.section.pk);
            });

            /**
             * watch for broadcasts of all child elements of a section being moved back to the labbook
             * this is triggered when a section element is deleted and the user chooses to
             * "Move all child elements back to the Labbook"
             */
            $rootScope.$on("labbook-move-all-section-child-elements-to-labbook", function (event, args) {
                var filters = {};
                var section_pk = args.section.pk;

                // check if a user filter is selected
                if (section_pk && section_pk.length > 0) {
                    filters['section'] = section_pk;
                }

                vm.labbookChildElementRestService.query(filters).$promise.then(
                    function success (response) {
                        // first update the position of the elements being moved
                        // this puts each element on the bottom of the labbook
                        var sectionChildElements = response;

                        for (var i = 0; i < sectionChildElements.length; i++) {
                            var childElement = sectionChildElements[i];

                            childElement.position_y = vm.getBottomY(vm.childElements);
                            childElement.$update();
                            vm.childElements.push(childElement);
                        }

                        // then remove the child elements from the section,
                        // which puts them automatically back in the labbook
                        vm.removeSectionChildElements(args.section.pk);
                    }
                );
            });

            /**
             * watch for broadcasts of child elements being moved back to the labbook from a section
             * this is triggered when an element in a section is moved back to the labbook using the menu option
             * this basically only updates the position of the element to be on the bottom of the labbook
             */
            $rootScope.$on("labbook-child-element-moved-back-to-labbook", function (event, args) {
                var movedChildElement = args.element;

                movedChildElement.position_y = vm.getBottomY(vm.childElements);
                movedChildElement.$update().then(
                    function success (response) {
                        vm.childElements.push(response);
                    }
                );
            });

            /**
             * watch for broadcasts of child elements being added to a section
             * this removes the element from the labbook
             */
            $rootScope.$on("labbook-child-element-added-to-section", function (event, args) {
                var removedChildElementPk = args.element_id;
                var updatedChildElements = [];

                // loop over the child elements and remove the one that has been added to the section
                angular.forEach(vm.childElements, function (childElement) {
                    if (childElement.pk !== removedChildElementPk) {
                        updatedChildElements.push(childElement);
                    } else {
                        vm.recalculationInProgress = LabbookService.recalculatePositions(
                            vm.childElements,
                            childElement,
                            vm.updateLabbookChildElements
                        );
                    }
                });
                vm.childElements = updatedChildElements;
            });

            /**
             * Configuration of the datepicker for the section elements
             * @type {Object}
             */
            var datePickerOptions = CalendarConfigurationService.getOptions({
                widgetPositioning: {horizontal: 'right', vertical: 'bottom'},
                allowInputToggle: true,
                showTodayButton: true,
                format: 'YYYY-MM-DD'
            });

            // copy date picker options for start date and stop date
            vm.sectionDateFilterPickerOptionsStartDate = angular.copy(datePickerOptions);
            vm.sectionDateFilterPickerOptionsStopDate = angular.copy(datePickerOptions);
            vm.section_date_filter_start_date = "";
            vm.section_date_filter_stop_date = "";
            vm.section_date_filter_start_date_placeholder = gettextCatalog.getString('Start date');
            vm.section_date_filter_stop_date_placeholder = gettextCatalog.getString('Stop date');

            vm.filteredOutSections = [];

            vm.getAllChildElements();
            updateProjectPks(vm.labbook);

        }; // end onInit

        /**
         * This removes a section element from the labbook child elements and
         * triggers a softdelete of the section element on success
         */
        vm.removeSectionElement = function (sectionPk) {
            var sectionElement = "";

            for (var i = 0; i < vm.childElements.length; i++) {
                if (vm.childElements[i].child_object_id === sectionPk) {
                    sectionElement = angular.copy(vm.childElements[i]);
                }
            }
            vm.recalculationInProgress = LabbookService.recalculatePositions(
                vm.childElements,
                sectionElement,
                vm.updateLabbookChildElements
            );
            if (sectionElement) {
                vm.labbookChildElementRestService.delete({pk: sectionElement.pk}).$promise.then(
                    function success (response) {
                        toaster.pop('success', gettextCatalog.getString("Section Deleted"));
                        vm.getAllChildElements();
                    },
                    function error (rejection) {
                        console.log(rejection);
                        if (rejection.data && rejection.data.non_field_errors) {
                            toaster.pop('error', gettextCatalog.getString("Delete failed"),
                                rejection.data.non_field_errors.join(" ")
                            );
                        } else {
                            toaster.pop('error', gettextCatalog.getString("Delete failed"));
                        }
                    }
                );
            }
        };

        /**
         * This removes all child elements of a section from the section.
         * They automatically become top level child elements of the labbook again.
         */
        vm.removeSectionChildElements = function (sectionPk) {
            var data = {
                'pk': sectionPk,
                'child_elements': []
            };

            LabbookSectionsRestService.updatePartial(data).$promise.then(
                function success (response) {
                    vm.removeSectionElement(sectionPk);
                },
                function error (rejection) {
                    console.log(rejection);
                }
            );
        };

        /**
         * This filters the sections to be displayed in the sectionFilterGrid by date.
         * Opens the sectionFilterGrid.
         * This is triggered by updateFilteredSections.
         */
        vm.filtersections = function () {
            vm.sectionFilterChildElements = [];
            if (vm.section_date_filter_start_date && vm.section_date_filter_stop_date) {

                var filter_start_date = vm.section_date_filter_start_date.startOf('day');
                var filter_stop_date = vm.section_date_filter_stop_date.startOf('day');

                for (var i = 0; i < vm.childElements.length; i++) {
                    var childElement = vm.childElements[i];

                    if (vm.isLabbookSection(childElement)) {
                        var sectionDate = moment(childElement.child_object.date);

                        if (sectionDate.isSameOrAfter(filter_start_date) &&
                            sectionDate.isSameOrBefore(filter_stop_date)) {
                            vm.sectionFilterChildElements.push(childElement);
                        }
                    }
                }
                vm.sectionFilterGrid = true;
            } else {
                vm.resetSectionFilter();
            }
        };

        /**
         * This checks if the dates are correct, then trigger the actual filtering
         * This is triggered by a watcher watching the date inputs
         */
        var updateFilteredSections = function () {
            if (vm.section_date_filter_start_date && vm.section_date_filter_stop_date) {
                var start_date = vm.section_date_filter_start_date.startOf('day');
                var stop_date = vm.section_date_filter_stop_date.startOf('day');

                if (start_date > stop_date) {
                    vm.section_date_filter_stop_date = "";
                    vm.section_date_filter_stop_date_placeholder = gettextCatalog.getString(
                        'Date must be after the Start date'
                    );
                } else {
                    vm.filtersections();
                }
            } else {
                vm.sectionFilterGrid = false;
            }
        };

        /**
         * Resets the dates and closes the sectionFilterGrid
         */
        vm.resetSectionFilter = function () {
            vm.sectionFilterGrid = false;
            vm.section_date_filter_start_date = "";
            vm.section_date_filter_stop_date = "";
        };

        // Watch potential filter settings and updateFilteredSections
        $scope.$watchGroup(["vm.section_date_filter_start_date", "vm.section_date_filter_stop_date"],
            updateFilteredSections
        );

        /**
         * Gets the element icon for a given element type.
         * Required for the element list of the smallLabbookView.
         * @param type The type of the element to get the icon for (e.g. Note)
         * @returns {*}
         */
        vm.getIcon = function (type) {
            return vm.mainElementIcons[type.toLowerCase()];
        };

        /**
         * Gets the translation for a given element type.
         * Required for the element list of the smallLabbookView.
         * @param type The type of the element
         * @returns {*}
         */
        vm.getTranslation = function (type) {
            return WorkbenchElementsTranslationsService.modelNameToTranslation[type.toLowerCase()];
        };

        /**
         * Determines whether the base model can be edited or not.
         * @returns {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.labbook);
        };

        /**
         * Checks whether the current user is allowed to create a new cell within the labbook
         * @returns {boolean}
         */
        vm.hasPermissionToAddNewModify = function () {
            return !vm.readOnly && PermissionService.has('object.edit', vm.labbook);
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
         * checks whether the new element is added to the labbook or to a section
         */
        var checkParentAndCalculatePosition = function (section, position, newWidth, newHeight) {
            var childElements = section ? section.childElements : vm.childElements;

            return calculatePositionOfNewElement(childElements, position, newWidth, newHeight);
        }

        /**
         * Calculates the position of the element when the element is added
         * E.g., if you want to add an element at the bottom of the grid, we need to calculate the x and y position
         * @param position [string] the position of the new element, either top or bottom
         * @param elements
         * @param newWidth
         * @param newHeight
         */
        var calculatePositionOfNewElement = function (elements, position, newWidth, newHeight) {
            var el = null,
                i = undefined;

            elements = elements || vm.childElements;

            if (position === 'top') {
                // move all child elements to the bottom by newHeight
                for (i = 0; i < elements.length; i++) {
                    el = elements[i];
                    el.position_y += newHeight;
                }

                // make sure to save the elements here to avoid movement on saves afterwards
                $timeout(function () {
                    vm.updateLabbookChildElements(elements);
                }, 100);

                return {
                    'height': newHeight,
                    'width': newWidth,
                    'position_x': 0,
                    'position_y': 0
                };
            } else if (position === 'bottom') {
                // make sure to save the elements here to avoid movement on saves afterwards
                $timeout(function () {
                    vm.updateLabbookChildElements(elements);
                }, 100);

                return {
                    'height': newHeight,
                    'width': newWidth,
                    'position_x': 0,
                    'position_y': vm.getBottomY(elements)
                };
            }

            // if we got so far, we do not know how to handle position (probably an error by the dev)
            console.error("Unknown position " + position);

            return {};
        };

        vm.getBottomY = function (elements) {
            var maxY = 0,
                element = undefined;

            for (var i = 0; i < elements.length; i++) {
                element = elements[i];
                maxY = Math.max(maxY, element.position_y + element.height);
            }

            return maxY;
        };

        /**
         * Adds a new picture via drag and drop on the "new picture" button
         *
         * @param files a list of files (provided by the drag and drop library)
         */
        vm.dragAndDropAddNewPicture = function (files) {
            if (files && files.length) {
                // open the picture create modal service and provide an existing picture
                pictureCreateModalService.open({
                    'projects': vm.labbook.projects, 'background_image': files
                }).result.then(
                    function success (element) {
                        // 2. determine the position where the new element should go
                        var data = calculatePositionOfNewElement(vm.childElements, vm.defaultPlacement, 20, 7);

                        data['child_object_id'] = element.pk;
                        data['child_object_content_type'] = element.content_type;

                        // 3. add the picture as a new labbook element
                        addNewLabbookChildElement(data);
                    },
                    function cancel () {
                    }
                );
            } else {
                toaster.pop('error', gettextCatalog.getString("Invalid file type"));
            }
        };

        /**
         * Add a new picture at the specified position
         * @param position the position (either "top" or "bottom")
         * @param section
         */
        vm.addNewPicture = function (position, section) {
            // create the picture create modal dialog and let the user fill in the details of the picture
            pictureCreateModalService.open({'projects': vm.labbook.projects}).result.then(
                function success (element) {
                    // 2. determine the position where the new element should go
                    var data = checkParentAndCalculatePosition(section, position, 20, 7);

                    data['child_object_id'] = element.pk;
                    data['child_object_content_type'] = element.content_type;

                    addNewLabbookChildElement(data, section);
                },
                function cancel () {
                    console.log("PictureCreateModal canceled");
                }
            );
        };

        /**
         * Add a new note at the specified position
         * This first creates a note via the Notes REST API, and then adds it to the lab book child elements
         * @param position
         * @param section
         */
        vm.addNewNote = function (position, section) {
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
                    var elementData = checkParentAndCalculatePosition(section, position, 20, 7);

                    elementData['child_object_id'] = element.pk;
                    elementData['child_object_content_type'] = element.content_type;

                    addNewLabbookChildElement(elementData, section);
                },
                function error (rejection) {
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Error"), rejection.data.detail);
                    } else if (rejection.status === 403) {
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
         * Add a new section at the specified position
         * This first creates a section via the labbooksection REST API, and then adds it to the labbook child elements
         * @param position
         */
        vm.addNewSection = function (position) {
            vm.sectionIsRendering = true;
            var data = {
                'date': moment().format("YYYY-MM-DD"),
                'title': gettextCatalog.getString("Section Name"),
                'projects': vm.labbook.projects
            };

            // 1. create a new section via REST API
            LabbookSectionsRestService.create(data).$promise.then(
                function success (element) {
                    // 2. determine the position where the new element should go
                    var elementData = calculatePositionOfNewElement(vm.childElements, position, 20, 1);

                    elementData['child_object_id'] = element.pk;
                    elementData['child_object_content_type'] = element.content_type;

                    addNewLabbookChildElement(elementData);
                },
                function error (rejection) {
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Error"), rejection.data.detail);
                    } else if (rejection.status === 403) {
                        // Permission denied -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Permission Denied"),
                            gettextCatalog.getString("You do not have permissions to create a new LabbookSection" +
                                " in this LabBook")
                        );
                    } else {
                        // Unknown error -> write our own error message
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Error"),
                            gettextCatalog.getString("Failed to create a new LabbookSection")
                        );
                    }
                    vm.sectionIsRendering = false;
                }
            );
        };

        /**
         * Add a new element at the specified location
         */
        vm.addNewElement = function (nextFunction) {
            var elementType = '',
                icon = '';

            // sets the icon and the elementType for dialog title depending on nextFunction
            switch (nextFunction) {
                case vm.addNewSection:
                    elementType = 'Section';
                    icon = vm.mainElementIcons.labbooksection;
                    break;
                case vm.addNewNote:
                    elementType = 'Note';
                    icon = vm.mainElementIcons.note;
                    break;
                case vm.addNewPicture:
                    elementType = 'Picture';
                    icon = vm.mainElementIcons.picture;
                    break;
                case vm.addNewFile:
                    elementType = 'File';
                    icon = vm.mainElementIcons.file;
                    break;
                default:
                    console.error("Unknown element type");
                    break;
            }

            newElementModalService.open(vm.childElements, elementType, icon, vm.labbook).result.then(
                function success (data) {
                    if (elementType === 'Section') {
                        nextFunction(data.location);
                    } else {
                        nextFunction(data.location, data.section);
                    }
                },
                function cancel () {
                    console.log("NewElementModal canceled");
                }
            );
        };

        /**
         * This returns true if the row (grid item) is a labbook section, so sections can have
         * different CSS to the other elements
         */
        vm.rowClass = function (item) {
            return {
                labbooksectionrow: item.child_object_content_type_model === 'labbooks.labbooksection'
            };
        };

        /**
         * When the user drag and drops a file on the "new file" button
         */
        vm.dragAndDropAddNewFile = function (files) {
            FileRestService.create({
                'title': gettextCatalog.getString("New File"),
                'name': files[0].name,
                'path': files[0],
                'projects': vm.labbook.projects
            }).$promise.then(
                function success (element) {
                    // 2. determine the position where the new element should go
                    var data = calculatePositionOfNewElement(vm.childElements, vm.defaultPlacement, 20, 7);

                    data['child_object_id'] = element.pk;
                    data['child_object_content_type'] = element.content_type;

                    addNewLabbookChildElement(data);
                },
                function error (rejection) {
                    console.log(rejection);

                    if (rejection.status === 507) {
                        // handle insufficient storage error - occurs when user storage limit was reached
                        var rejectionMessage = GlobalErrorHandlerService.handleRestApiStorageError(rejection);

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
        };

        /**
         * Add a new file at the specified position
         * Asks the user for a file to upload
         */
        vm.addNewFile = function (position, section) {
            var template = undefined,
                projectPks = vm.labbook.projects;

            fileCreateModalService.open(template, projectPks).result.then(
                function success (element) {
                    // 2. determine the position where the new element should go
                    var data = checkParentAndCalculatePosition(section, position, 20, 7);

                    data['child_object_id'] = element.pk;
                    data['child_object_content_type'] = element.content_type;

                    addNewLabbookChildElement(data, section);
                },
                function cancel () {
                    console.log("FileCreateModal canceled");
                }
            );
        };

        /**
         * Add an element to the labbook
         * @param xPosition
         * @param width
         * @param height
         * @param element
         * @returns {*}
         */
        var addWorkbenchElementToLabbookFromTemplateCell = function (xPosition, width, height, element) {
            var data = calculatePositionOfNewElement(vm.childElements, vm.defaultPlacement, width, height);

            data['position_x'] = xPosition;
            data['child_object_id'] = element.pk;
            data['child_object_content_type'] = element.content_type;

            return addNewLabbookChildElement(data);
        };

        /**
         * Create a workbench element from a template cell
         * @param contentType
         * @param childElement
         * @returns {Promise}
         */
        var createWorkbenchElementFromTemplateCell = function (contentType, childElement) {
            var existingWorkbenchElement = childElement.child_object;
            var promise = null;

            switch (contentType) {
                case "shared_elements.file":
                    promise = FileRestService.create({
                        'projects': vm.labbook.projects,
                        'name': existingWorkbenchElement.name,
                        'description': existingWorkbenchElement.description,
                        'path': existingWorkbenchElement.pk // needs to be set as the primary key so we can copy it
                    }).$promise;
                    break;
                case "shared_elements.note":
                    promise = NoteRestService.create({
                        'projects': vm.labbook.projects,
                        'subject': existingWorkbenchElement.subject,
                        'content': existingWorkbenchElement.content
                    }).$promise;
                    break;
                case "pictures.picture":
                    promise = PictureRestService.create({
                        'projects': vm.labbook.projects,
                        'title': existingWorkbenchElement.title,
                        'width': existingWorkbenchElement.width,
                        'height': existingWorkbenchElement.height,
                        'rendered_image': existingWorkbenchElement.pk,
                        'background_image': existingWorkbenchElement.pk, // needs to be set as the primary key so we can copy it
                        'shapes_image': existingWorkbenchElement.pk // needs to be set as the primary key so we can copy it
                    }).$promise;
                    break;
                case "labbooks.labbooksection":
                    promise = LabbookSectionsRestService.create({
                        'projects': vm.labbook.projects,
                        'title': existingWorkbenchElement.title,
                        'date': existingWorkbenchElement.date
                    }).$promise;
                    break;
                default:
                    // wrong contentType, probably a dev error
                    console.error("Unknown content type model: " + existingWorkbenchElement.content_type_model);

                    return $q.when();
            }

            var defer = $q.defer();

            // wait for the promise (create) to be resolved
            promise.then(
                function success (response) {
                    console.log("adding " + existingWorkbenchElement.content_type_model + " at the following position: " + childElement.position_x);

                    // response contains the new element -> add it to the labbook
                    addWorkbenchElementToLabbookFromTemplateCell(
                        childElement.position_x,
                        childElement.width,
                        childElement.height,
                        response
                    ).then(function (addElementResponse) {
                        console.log("LabBook: Finished adding childelement " + childElement.display);
                        defer.resolve(addElementResponse);
                    });
                },
                function error (rejection) {
                    console.log(rejection);
                    if (!labbookImportInProgressService.checkForImportInProgress()) {
                        toaster.pop('error',
                            gettextCatalog.getString("Error"),
                            gettextCatalog.getString("Could not create " + existingWorkbenchElement.content_type_model)
                        );
                    }
                    defer.resolve(rejection);
                }
            );

            return defer.promise;
        };

        var createLabbookChildElementForSectionImport = function (
            section,
            data,
            childElement,
            defer,
            existingWorkbenchElement
        ) {
            vm.labbookChildElementRestService.create(data).$promise.then(
                function success (response) {
                    var sectionChildElementPk = response.pk;

                    // 2. get the current child elements of the section
                    defer = getSectionChildElementsForSectionImport(
                        section,
                        data,
                        sectionChildElementPk,
                        childElement,
                        defer,
                        existingWorkbenchElement
                    );
                },
                function error (rejection) {
                    console.log(rejection);
                    defer.reject();
                }
            );

            return defer;
        };

        var getSectionChildElementsForSectionImport = function (
            section,
            data,
            sectionChildElementPk,
            childElement,
            defer,
            existingWorkbenchElement
        ) {
            LabbookSectionsRestService.get({pk: section.pk}).$promise.then(
                function success (response) {
                    var childElements = response.child_elements;

                    childElements.push(sectionChildElementPk);
                    var sectionData = {
                        'pk': section.pk,
                        'child_elements': childElements
                    };

                    // 3. add the newly created element to the section child_elements
                    defer = addLabbookChildElementToSectionForSectionImport(
                        sectionData,
                        sectionChildElementPk,
                        childElement,
                        defer,
                        existingWorkbenchElement
                    );
                },
                function error (rejection) {
                    console.log(rejection);
                    defer.reject();
                }
            );

            return defer;
        };

        var addLabbookChildElementToSectionForSectionImport = function (
            data,
            sectionChildElementPk,
            childElement,
            defer,
            existingWorkbenchElement
        ) {
            LabbookSectionsRestService.updatePartial(data).$promise.then(
                function success (response) {
                    var removedChildElementPk = sectionChildElementPk;
                    var updatedChildElements = [];

                    // we remove the new section element from the labbook here
                    angular.forEach(vm.childElements, function (currentElement) {
                        if (currentElement.pk !== removedChildElementPk) {
                            updatedChildElements.push(currentElement);
                        }
                    });
                    vm.childElements = updatedChildElements;

                    // 4. now lets set the positioning in the section as it was before
                    defer = recreatePositionOfSectionChildElementForSectionImport(
                        sectionChildElementPk,
                        childElement,
                        defer,
                        existingWorkbenchElement
                    );
                },
                function error (rejection) {
                    console.log(rejection);
                    defer.reject();
                }
            );

            return defer;
        };

        var recreatePositionOfSectionChildElementForSectionImport = function (
            sectionChildElementPk,
            childElement,
            defer,
            existingWorkbenchElement
        ) {
            var data = {};

            // positions in the sections as before
            data['pk'] = sectionChildElementPk;
            data['height'] = childElement['height'];
            data['width'] = childElement['width'];
            data['position_x'] = childElement['position_x'];
            data['position_y'] = childElement['position_y'];

            // 4. now lets set the positioning in the section as it was before
            vm.labbookChildElementRestService.updatePartial(data).$promise.then(
                function success (response) {
                    defer.resolve(response);
                },
                function error (rejection) {
                    console.log(rejection);
                    defer.reject();
                }
            );

            return defer;
        };

        /**
         * Create a workbench element from a template cell
         * @param childElement
         * @param section
         * @returns {Promise}
         */
        var createSectionElementFromTemplateCell = function (childElement, section) {
            var existingWorkbenchElement = childElement.child_object;
            var contentType = childElement.child_object.content_type_model;

            /**
             * Promise for creating a new file/note/picture (filled within the switch statement)
             * @type {null}
             */
            var promise = null;

            // select the content type (file, note, picture)
            switch (contentType) {
                case "shared_elements.file":
                    promise = FileRestService.create({
                        'projects': vm.labbook.projects,
                        'name': existingWorkbenchElement.name,
                        'description': existingWorkbenchElement.description,
                        'path': existingWorkbenchElement.pk // needs to be set as the primary key so we can copy it
                    }).$promise;
                    break;
                case "shared_elements.note":
                    promise = NoteRestService.create({
                        'projects': vm.labbook.projects,
                        'subject': existingWorkbenchElement.subject,
                        'content': existingWorkbenchElement.content
                    }).$promise;
                    break;
                case "pictures.picture":
                    promise = PictureRestService.create({
                        'projects': vm.labbook.projects,
                        'title': existingWorkbenchElement.title,
                        'width': existingWorkbenchElement.width,
                        'height': existingWorkbenchElement.height,
                        'rendered_image': existingWorkbenchElement.pk,
                        'background_image': existingWorkbenchElement.pk, // needs to be set as the primary key so we can copy it
                        'shapes_image': existingWorkbenchElement.pk // needs to be set as the primary key so we can copy it
                    }).$promise;
                    break;
                default:
                    // wrong contentType, probably a dev error
                    console.error("Unknown content type model: " + existingWorkbenchElement.content_type_model);

                    return $q.when();
            }

            var defer = $q.defer();

            // wait for the promise (create) to be resolved
            promise.then(
                function success (response) {
                    // put the section element on the bottom of the labbook for now
                    var data = calculatePositionOfNewElement(
                        vm.childElements,
                        vm.defaultPlacement,
                        childElement['width'],
                        childElement['height']
                    );

                    data['child_object_id'] = response.pk;
                    data['child_object_content_type'] = response.content_type;
                    // 1. create the labbook child element
                    defer = createLabbookChildElementForSectionImport(
                        section,
                        data,
                        childElement,
                        defer,
                        existingWorkbenchElement
                    );

                },
                function error (rejection) {
                    console.log(rejection);
                    if (!labbookImportInProgressService.checkForImportInProgress()) {
                        toaster.pop('error',
                            gettextCatalog.getString("Error"),
                            gettextCatalog.getString("Could not create " + existingWorkbenchElement.content_type_model)
                        );
                    }
                    defer.resolve(rejection);
                }
            );

            return defer.promise;
        };

        /**
         * Create a a section and its children from a template cell
         * @param sectionElement
         * @param sectionChildElements
         * @returns {Promise}
         */
        var createSectionAndChildrenFromTemplateCell = function (sectionElement, sectionChildElements) {
            var existingWorkbenchElement = sectionElement.child_object;

            /**
             * Promise for creating a new file/note/picture (filled within the switch statement)
             * @type {null}
             */
            var promise = null;

            // create the section first
            promise = LabbookSectionsRestService.create({
                'projects': vm.labbook.projects,
                'title': existingWorkbenchElement.title,
                'date': existingWorkbenchElement.date
            }).$promise;

            var defer = $q.defer();

            // wait for the promise (create) to be resolved
            promise.then(
                function success (createSectionResponse) {
                    console.log("adding " + existingWorkbenchElement.content_type_model +
                        " at the following position: " + sectionElement.position_x);

                    var section = createSectionResponse;

                    // response contains the new element -> add it to the labbook
                    addWorkbenchElementToLabbookFromTemplateCell(
                        sectionElement.position_x,
                        sectionElement.width,
                        sectionElement.height,
                        createSectionResponse
                    ).then(function (addElementResponse) {
                        console.log("LabBook: Finished adding childelement " + sectionElement.display);

                        var sectionPromiseChain = $q.when();

                        angular.forEach(sectionChildElements, function (sectionChildElement) {
                            sectionPromiseChain = sectionPromiseChain.then(
                                // wrap the function call in an anonymous function
                                function () {
                                    return createSectionElementFromTemplateCell(sectionChildElement, section);
                                }
                            );
                        });
                        sectionPromiseChain.then(function () {
                            defer.resolve(addElementResponse);
                        });
                    })
                },
                function error (rejection) {
                    console.log(rejection);
                    defer.reject();
                }
            );

            return defer.promise;
        };

        /**
         * Lets the user insert cells from a LabBook Template
         * For this to work we are opening a modal dialog, where the user can select another labbook that is marked
         * as a template
         * When this dialog is closed, we are getting an object with a list of cells and an object with sections
         * and their children that should be added to the Labbook, with pre-filled content
         */
        vm.insertCellsFromTemplate = function () {
            var modalInstance = $uibModal.open({
                'controller': 'LabbookSelectTemplateModalController',
                'templateUrl': 'js/screens/labbook/labbookSelectTemplateModal.html',
                'controllerAs': 'vm',
                'bindToController': true,
                'backdrop': 'static'
            });

            modalInstance.result.then(
                /**
                 * childElements contains a list of labbook child elements, where each of those contains an actual
                 * workbench element (such as a picture, note, file) that we need to create
                 * To accomplish this, we need to clone the existing workbench element
                 */
                function addElements (allElements) {
                    vm.metaDataCollapsed = true;
                    labbookImportInProgressService.setTrue();
                    /**
                     * chain of promises for adding workbench elements and cells
                     * @type {Promise}
                     */
                    var promiseChain = $q.when();

                    var childElements = allElements['collectedChildElements'];
                    var sectionChildElements = allElements['collectedSectionChildElements'];

                    // iterate over all child elements, and open a new JS Closure (hence angular.forEach)
                    angular.forEach(childElements, function (childElement) {
                        // if the childElement is a section and has child_elements to import
                        if (sectionChildElements[childElement.child_object.pk]) {
                            // go through the promise chain
                            promiseChain = promiseChain.then(
                                function () {
                                    return $timeout(2000);
                                }).then(
                                // wrap the function call in an anonymous function
                                function () {
                                    return createSectionAndChildrenFromTemplateCell(childElement,
                                        sectionChildElements[childElement.child_object.pk]);
                                }
                            );
                        } else {
                            // go through the promise chain
                            promiseChain = promiseChain.then(
                                function () {
                                    return $timeout(2000);
                                }).then(
                                // wrap the function call in an anonymous function
                                function () {
                                    return createWorkbenchElementFromTemplateCell(
                                        childElement.child_object.content_type_model, childElement
                                    );
                                }
                            );
                        }
                    });

                    // wait for all promises to finish
                    promiseChain.then(
                        function () {
                            return $timeout(2000);
                        }).then(
                        function () {
                            vm.getAllChildElements();
                        }).then(
                        function () {
                            return $timeout(2000);
                        }).then(
                        function allFinished () {
                            labbookImportInProgressService.setFalse();
                            console.log("done");
                            toaster.pop('success', gettextCatalog.getString("LabBook Import done"));
                        }
                    );
                },
                function dismiss () {
                    console.log("Modal Dialog dismissed");
                }
            );
        };

        /**
         * Saves basic labbook attributes (such as the title) via REST API
         */
        vm.saveLabbook = function () {
            vm.readOnly = true;
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // set projects
            vm.labbook.projects = vm.projectPks;

            // update LabBook via rest api
            vm.labbook.$update().then(
                function success (response) {
                    updateProjectPks(response);
                    // worked
                    vm.labbook = response;
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
                        toaster.pop('error', gettextCatalog.getString("Failed to update LabBook"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Saves a labbook via REST API partial update
         * @param key
         * @param value
         */
        vm.saveLabbookPartial = function (key, value) {
            vm.readOnly = true;
            // always initialize with primary key
            var data = {
                pk: vm.labbook.pk
            };

            data[key] = value;

            console.log('on before save: save contact partial');

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            LabbookRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    vm.labbook = response;
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
                    } else if (rejection.status === 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                        vm.errors[key] = [rejection.data.detail];
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Labbook"));
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
         * Add a new labbook child element via REST API
         * @param item
         * @param section
         */
        var addNewLabbookChildElement = function (item, section) {
            if (section != null) {
                // skipping the next websocket refresh, so the labbook top level grid
                // doesn't show this element there for a short time
                vm.skipNextWebsocketRefresh = true;
            } else {
                $rootScope.$emit("labbook-child-element-added-to-labbook");
            }

            // call rest api
            return vm.labbookChildElementRestService.create(item).$promise.then(
                function success (response) {
                    if (!labbookImportInProgressService.checkForImportInProgress()) {
                        if (section != null) {
                            addChildElementToSection(response, section);
                            setTimeout(function () {
                                vm.skipNextWebsocketRefresh = false;
                                $rootScope.$emit("new-child-element-added-to-section", {section: section});
                            }, 2000);
                        } else {
                            toaster.pop('success', gettextCatalog.getString("Cell added"));
                        }
                    }
                },
                function error (rejection) {
                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        console.log(rejection);
                        if (!labbookImportInProgressService.checkForImportInProgress()) {
                            toaster.pop('error', gettextCatalog.getString("Error"), rejection.data.detail);
                        }
                    } else if (rejection.status === 403) {
                        // Permission denied -> write our own error message
                        if (!labbookImportInProgressService.checkForImportInProgress()) {
                            toaster.pop('error', gettextCatalog.getString("Permission Denied"),
                                gettextCatalog.getString("You do not have permissions to add an element in this LabBook")
                            );
                        }
                    } else {
                        // Unknown error -> write our own error message
                        console.log(rejection);
                        if (!labbookImportInProgressService.checkForImportInProgress()) {
                            toaster.pop('error', gettextCatalog.getString("Error"),
                                gettextCatalog.getString("Could not add new cell")
                            );
                        }
                    }
                }
            ).finally(function () {
                // in any case we need to reload the labbook details
                if (!labbookImportInProgressService.checkForImportInProgress()) {
                    $timeout(function () {
                        vm.getAllChildElements();
                    }, 2000);
                }
            });
        };

        /**
         * Add child element to the section via REST API
         * @param item
         * @param section
         */
        var addChildElementToSection = function (item, section) {
            // add the elements pk to child elements
            section.child_object.child_elements.push(item.pk);
            var data = {
                'pk': section.child_object.pk,
                'child_elements': section.child_object.child_elements
            };

            // 1. update the child elements of the section
            LabbookSectionsRestService.updatePartial(data).$promise.then(
                function success (response) {
                    // 2. trigger removal from the labbook grid
                    $rootScope.$emit("labbook-child-element-added-to-section", {element_id: item.pk});
                    toaster.pop('success', gettextCatalog.getString("Cell added"));
                    vm.updateLabbookChildElements(section.childElements);
                },
                function error (rejection) {
                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Error"), rejection.data.detail);
                    } else if (rejection.status === 403) {
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
                $timeout(function () {
                    vm.getAllChildElements();
                }, 2000);
            });
        };

        vm.refreshLabbookChildElements = function () {
            vm.labbookChildElementRestService.query().$promise.then(
                function success (response) {
                    // we can not simple overwrite vm.childElements, as the data is kept in a datastore/cache
                    // instead, we reset child elements array and then push all items from response into it
                    vm.childElements.length = 0;

                    // push the response into childElements
                    Array.prototype.push.apply(vm.childElements, response);
                },
                function error (rejection) {
                    console.log(rejection);
                    if (!labbookImportInProgressService.checkForImportInProgress()) {
                        toaster.pop('error', gettextCatalog.getString("Failed to update LabBook"));
                    }
                }
            );
        };

        /**
         * Updates positioning of ALL labbook child elements via the REST API
         *
         * This is necessary, e.g., when a labbook child element is moved from one position to another position,
         * because movement of one element might cause movement of other elements
         */
        vm.updateLabbookChildElements = function (elements) {
            if (!labbookImportInProgressService.checkForImportInProgress()) {
                /**
                 * List of all child elements (collected in the for loop)
                 *
                 * Each object contains the primary key (pk) and the position (position_x/y, width/height) of the child
                 * element
                 * @type {Array}
                 */
                var capturedChildElements = [];

                // collect the positioning of all child elements
                for (var i = 0; i < elements.length; i++) {
                    capturedChildElements.push({
                        'pk': elements[i].pk,
                        'position_y': elements[i].position_y,
                        'position_x': elements[i].position_x,
                        'width': elements[i].width,
                        'height': elements[i].height
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
                        vm.getAllChildElements();

                        // skip next websocket fresh for roughly 100 ms

                        setTimeout(function () {
                            vm.skipNextWebsocketRefresh = false;
                        }, 100);

                        if (rejection.status === 403) {
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
            }

            return false;
        };

        /**
         * Updates a list of project pks
         * This is necessary as the list of PKs has a different reference,
         * and the angular $watchGroup does not allow
         * to watch for array changes
         * @param labbook
         */
        var updateProjectPks = function (labbook) {
            vm.projectPks.length = 0;
            if (labbook.projects) {
                for (var i = 0; i < labbook.projects.length; i++) {
                    vm.projectPks.push(labbook.projects[i]);
                }
            }
        };

        vm.isLabbookSection = function (childElement) {
            return childElement.child_object_content_type_model === 'labbooks.labbooksection';
        };

        vm.isLabbookElement = function (childElement) {
            return childElement.child_object_content_type_model !== 'labbooks.labbooksection';
        };

        vm.checkImportInProgress = function () {
            return labbookImportInProgressService.checkForImportInProgress();
        };

        /**
         * Get All child elements and store the data and the actual elements in
         * - vm.childElements - dictionary that contains the actual child elements, such as note, picture, ...
         * @returns {promise}
         */
        vm.getAllChildElements = function () {
            return vm.labbookChildElementRestService.query().$promise.then(
                function success (response) {
                    if (response.length > 0) {
                        vm.metaDataCollapsed = true;
                    } else {
                        if (!labbookImportInProgressService.checkForImportInProgress()) {
                            vm.metaDataCollapsed = false;
                        }
                    }

                    vm.childElements = response;
                    vm.childElementsLoaded = true;
                }
            ).finally(function () {
                vm.noteIsRendering = false;
                vm.sectionIsRendering = false;
            });
        };
    });
})();
