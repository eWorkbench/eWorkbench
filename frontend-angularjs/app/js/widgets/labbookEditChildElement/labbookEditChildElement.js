/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name labbookEditChildElementWidget
     *
     * @restrict E
     *
     * @description
     * Renders a Child Element of a LabBook (e.g., Note/Text, File, Picture)
     *
     * @param element the child elemnt that needs to be rendered
     */
    module.directive('labbookEditChildElementWidget', function () {
        return {
            templateUrl: 'js/widgets/labbookEditChildElement/labbookEditChildElement.html',
            controller: 'LabbookEditChildElementWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                element: '=',
                sectionChildElements: '=',
                labbookChildElements: "=",
                labbook: '=',
                isInSectionGrid: '=',
                sectionElement: '='
            },
            link: function (scope, element, attrs) {
                scope.domElement = jQuery(element);
            }
        }
    });

    /**
     * Controller for labbookEditChildElementWidget
     */
    module.controller('LabbookEditChildElementWidgetController', function (
        $rootScope,
        $scope,
        $q,
        $state,
        $timeout,
        $uibModal,
        $window,
        AuthRestService,
        ElementLockRestService,
        ExportDataService,
        NoteRestService,
        FileRestService,
        IconImagesService,
        noteListModalService,
        PermissionService,
        PictureRestService,
        PlugininstanceRestService,
        objectPrivilegesModalService,
        recentChangesModalService,
        WorkbenchElementChangesWebSocket,
        WorkbenchElementsTranslationsService,
        confirmDialogWidget,
        gettextCatalog,
        pictureViewModalService,
        toaster,
        moveLabbookElementToSectionModalService,
        LabbookSectionsRestService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * Rest service of the element
             * @type {null}
             */
            vm.elementRestService = null;

            /**
             * Name of the workbench element model
             */
            vm.baseUrlModel = null;

            /**
             * Whether the menu (drag&drop, ...) for the current child element is currently shown or not
             * This is automatically set in onMouseEnter/onMouseLeave
             * @type {boolean}
             */
            vm.showElementMenu = false;

            /**
             * whether the mouse is currently inside of the menu
             * @type {boolean}
             */
            vm.mouseIsInsideMenu = false;

            /**
             * Whether the dropdown menu is currently shown or not
             * @type {boolean}
             */
            vm.dropDownMenuActive = false;

            /**
             * type of the element
             * @type {string}
             */
            vm.elementType = null;

            /**
             * Attribute name of the title
             * @type {null}
             */
            vm.elementTitleAttributeName = null;

            /**
             * title of the element
             * @type {string}
             */
            vm.elementTitle = null;

            /**
             * The link to the element
             * @type {null}
             */
            vm.elementLink = null;

            /**
             * Whether the content of current element has unsaved changes (triggered by editable select list)
             * @type {boolean}
             */
            vm.hasUnsavedChanges = false;

            /**
             * Whether the title of the current element has unsaved changes (triggered by editable select list)
             * @type {boolean}
             */
            vm.titleHasUnsavedChanges = false;

            /**
             * Whether or not
             * @type {boolean}
             */
            vm.isSaving = false;

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            vm.actionIcons = IconImagesService.mainActionIcons;
            vm.elementIcons = IconImagesService.mainElementIcons;
            vm.genericIcons = IconImagesService.genericIcons;

            vm.lockStatus = null;
            vm.latestVersion = vm.element.version_number;

            var baseContentType = vm.element.child_object_content_type_model;
            var modelName = WorkbenchElementsTranslationsService.contentTypeToModelName[baseContentType].toLowerCase();

            vm.elementLockService = ElementLockRestService(modelName, vm.element.child_object_id);

            /**
             * Initialize WebSocket: Subscribe to changes on the websocket
             */
            var wsUnsubscribeFunction = WorkbenchElementChangesWebSocket.subscribe(
                modelName, vm.element.child_object_id, function onChange (jsonMessage) {
                    // this element has changed
                    if (jsonMessage['element_changed'] || jsonMessage['element_relations_changed']) {
                        // update the element
                        vm.element.$getCached().then(initElement).then(function () {
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

            vm.childElement = vm.element.child_object;

            /**
             * Content type of the new element
             */
            var contentType = vm.element.child_object_content_type_model;

            // ignore element if content type is not set
            if (contentType) {
                switch (contentType) {
                    case 'shared_elements.note':
                        vm.elementType = "note";
                        vm.elementTitleAttributeName = 'subject';
                        vm.elementRestService = NoteRestService;
                        break;
                    case 'pictures.picture':
                        vm.elementType = "picture";
                        vm.elementTitleAttributeName = 'title';
                        vm.elementRestService = PictureRestService;
                        break;
                    case 'shared_elements.file':
                        vm.elementType = "file";
                        vm.elementTitleAttributeName = 'title';
                        vm.elementRestService = FileRestService;
                        break;
                    case 'plugins.plugininstance':
                        vm.elementType = "plugininstance";
                        vm.elementTitleAttributeName = 'title';
                        vm.elementRestService = PlugininstanceRestService;
                        break;

                    default:
                        // content type not recognized as a valid type of labbook
                        console.error("Invalid child_object_content_type_model '" + contentType + "' for LabBook");

                        return;
                }

                /**
                 * Check if elementRestService was set
                 */
                if (vm.elementRestService) {
                    // determine base url model
                    vm.baseUrlModel = WorkbenchElementsTranslationsService.contentTypeToModelName[
                        vm.childElement.content_type_model] + "s";

                    // store the title in a separate viewmodel variable
                    vm.elementTitle = vm.childElement[vm.elementTitleAttributeName];

                    // generate the link
                    switch (contentType) {
                        case 'shared_elements.note':
                            vm.elementLink = $state.href('note-view', {note: vm.childElement});
                            break;
                        case 'pictures.picture':
                            vm.elementLink = $state.href('picture-view', {picture: vm.childElement});
                            break;
                        case 'shared_elements.file':
                            vm.elementLink = $state.href('file-view', {file: vm.childElement});
                            break;
                        case 'plugins.plugininstance':
                            vm.elementLink = $state.href('plugininstance-view', {plugininstance: vm.childElement});
                            break;
                        default:
                            // could not find contentType - probably a dev error
                            console.error("Invalid content type " + contentType);
                    }
                }

                $timeout(function () {
                    initElementLockWatcher();
                });
            }
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
         * On Mouse Enter show the menu icons
         */
        vm.onMouseEnter = function () {
            vm.showElementMenu = true;
            vm.mouseIsInsideMenu = true;
        };

        /**
         * On Mouse Leave hide the menu icons
         */
        vm.onMouseLeave = function () {
            vm.mouseIsInsideMenu = false;
            if (vm.showElementMenu && vm.dropDownMenuActive) {
                console.log("Keeping dropdown menu active for now");
            } else {
                vm.showElementMenu = false;
            }
        };

        /**
         * Called when the dropdown menu is opened or closed
         * When it is closed, we need to check if the mouse has left and we should hide menu
         * @param open
         */
        vm.dropdownMenuToggled = function (open) {
            if (!vm.mouseIsInsideMenu && open == false) {
                vm.showElementMenu = false;
            }
        };

        /**
         * Open the privileges modal dialog
         */
        vm.openPrivilegesModalDialog = function () {
            objectPrivilegesModalService.open(vm.baseUrlModel, vm.childElement);
        };

        /**
         * Open the sections modal dialog so elements can be moved to a section
         */
        vm.openSectionModalDialog = function () {
            if (vm.labbook) {
                moveLabbookElementToSectionModalService.open(vm.childElement, vm.element.pk, vm.labbook.pk,
                    vm.sectionElement, vm.labbookChildElements);
            }
        };

        /**
         * Moves an element out of a section back into the labbook
         */
        vm.moveElementOutOfSection = function () {
            // confirm modal dialog
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Move?'),
                message: gettextCatalog.getString('Do you really want to move this element ' +
                    'out of this Section and back to your LabBook?'),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Move'),
                dialogKey: 'MoveElementOutOfSection'
            });

            // react on the result of the modal dialog
            modalInstance.result.then(
                function confirm (doDelete) {
                    var d = $q.defer();

                    if (doDelete && vm.element && vm.sectionElement) {
                        // get the current child elements
                        var currentChildElements = vm.sectionElement.child_object.child_elements;
                        var childElements = [];

                        // dont add the element being removed to the list
                        for (var i = 0; i < currentChildElements.length; i++) {
                            if (currentChildElements[i] !== vm.element.pk) {
                                childElements.push(currentChildElements[i]);
                            }
                        }
                        // setup the new data without the element being removed
                        var data = {
                            'pk': vm.sectionElement.child_object.pk,
                            'child_elements': childElements
                        };

                        LabbookSectionsRestService.updatePartial(data).$promise.then(
                            function success (response) {
                                vm.sectionElement.child_object = response;
                                // trigger removal from the section
                                $rootScope.$emit("labbook-child-element-moved-from-section",
                                    {element: vm.element});
                                // trigger repositioning and adding to the labbook top level
                                $rootScope.$emit("labbook-child-element-moved-back-to-labbook",
                                    {element: vm.element});
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
                                    toaster.pop('error', gettextCatalog.getString("Failed to update Element"));
                                    d.reject(gettextCatalog.getString("Unknown error"));
                                }
                            }
                        );
                    }

                    return d.promise;
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }
            );
        };

        /**
         * Tries to export the element
         */
        vm.exportElement = function () {
            ExportDataService.doExport({model: vm.baseUrlModel, pk: vm.childElement.pk});
        };

        /**
         * Opens the recent changes modal dialog
         */
        vm.openRecentChangesModalDialog = function () {
            recentChangesModalService.open(vm.childElement);
        };

        /**
         * Opens the notes modal dialog
         */
        vm.openNotesModalDialog = function () {
            var modalInstance = noteListModalService.open(vm.childElement);

            // refresh relations when this is done
            modalInstance.result.then(
                function close () {
                    // we need to update the number of notes of this element
                    vm.element.$getCached();
                },
                function dismiss () {
                    // we need to update the number of notes of this element
                    vm.element.$getCached();
                }
            )
        };

        /**
         * Open a modal dialog for editing the picture cell
         * Inline editing with the picture view is literally impossible, therefore opening a modal dialog is more
         * user-friendly
         */
        vm.editPictureCell = function () {
            // do not allow editing if this element is readonly
            if (vm.isReadonly()) {
                return;
            }

            // open a modal dialog with the picture cell
            var modalInstance = pictureViewModalService.open(vm.childElement);

            /**
             * On Close, update the child element
             */
            modalInstance.result.then(
                function close (updatedChildElement) {
                    vm.childElement = updatedChildElement.picture;
                },
                function dismiss (updatedChildElement) {
                    if (updatedChildElement && updatedChildElement.picture) {
                        vm.childElement = updatedChildElement.picture;
                    }
                }
            );
        };

        /**
         * set a flag to toggle between showing the picture representation of
         * the Plugininstance-Childelement or the 3rd-party editor in an iframe
         * (also see labbookEditChildElement.html in the App-section)
         */
        vm.editPlugininstanceCell = function () {
            // do not allow editing if this element is readonly
            if (vm.isReadonly()) {
                return;
            }
            vm.childElement.plugininstanceEditMode = true;
        };

        /**
         * Asks the user if they want to remove this element from the labbook
         * The element will only be removed from the labbook, but will stay available for edit in the workbench
         */
        vm.removeElementFromLabbook = function () {
            // create modal dialog
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Remove?'),
                message: gettextCatalog.getString('Do you really want to remove this element from your LabBook?'),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Remove'),
                dialogKey: 'RemoveElementFromLabbook'
            });

            // react on the result of the modal dialog
            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        // triggers the removal of a top level labbook child element
                        if (vm.labbook && !vm.isInSectionGrid) {
                            $scope.$emit("labbook-remove-child-element", {childElement: vm.element});
                        }
                        // triggers the removal of a child element in a section
                        if (vm.labbook && vm.isInSectionGrid) {
                            $scope.$emit("section-remove-child-element", {childElement: vm.element});
                        }
                    }
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }
            );
        };

        /**
         * Asks the user if they really want to delete this element
         * The element will be removed from the labbook by soft deleting it
         */
        vm.deleteElement = function () {
            // create modal dialog
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Delete?'),
                message: gettextCatalog.getString(
                    'Do you really want to trash this element and remove it from your LabBook?'
                ),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Delete'),
                dialogKey: 'TrashAndDeleteElementFromLabbook'
            });

            // react on the result of the modal dialog
            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        vm.elementRestService.resource.softDelete({pk: vm.childElement.pk}).$promise.then(
                            function success (response) {
                                toaster.pop('success', gettextCatalog.getString("Deleted"));

                                // now remove the child element from the labbook
                                if (vm.labbook && !vm.isInSectionGrid) {
                                    $scope.$emit("labbook-remove-child-element", {childElement: vm.element});
                                }
                                // or remove the child element from the section
                                if (vm.labbook && vm.isInSectionGrid) {
                                    $scope.$emit("section-remove-child-element", {childElement: vm.element});
                                }
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
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }
            );
        };

        /**
         * Save the title of the current element
         * This is accomplished by making a "partial" update (PATCH) with vm.elementTitleAttributeName
         * @param title
         * @returns {*}
         */
        vm.saveCellTitle = function (title) {
            var d = $q.defer();

            // reset errors
            vm.errors = {};

            // update the child element
            vm.childElement[vm.elementTitleAttributeName] = title;

            /**
             * data that is to be sent via the REST Api
             * needs the primary key and the title that we are changing
             * @type {{pk}}
             */
            var data = {
                'pk': vm.childElement.pk
            };

            // set the title in the data that is to be sent via REST API
            data[vm.elementTitleAttributeName] = title;

            // save the title field via updatePartial
            vm.elementRestService.updatePartial(data).$promise.then(
                function success (response) {
                    // success
                    vm.childElement = response;
                    d.resolve(vm.childElement);
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
                        d.reject(rejection.data[vm.elementTitleAttributeName].join(", "));
                    }
                }
            );

            return d.promise;
        };

        /**
         * Resets errors for the current cell (e.g., empty title field)
         * Called by the editable-select-list widget
         */
        vm.resetCellTitleErrors = function () {
            vm.errors = {};
        };

        /**
         * Saves Changes for childElement via REST API (using updatePartial)
         *
         * @returns {promise}
         */
        vm.save = function () {
            vm.errors = {};
            vm.isSaving = true;

            var d = $q.defer();

            var data = {
                'pk': vm.childElement.pk
            };

            // set the title in the data that is to be saved
            data[vm.elementTitleAttributeName] = vm.childElement[vm.elementTitleAttributeName];

            // determine which content/title element needs to be saved
            switch (vm.elementType) {
                case "note":
                    data['content'] = vm.childElement.content;
                    break;
                // this needs to be here, otherwise we can't save picture titles when
                // there are other child elements with unsaved changes
                case "picture":
                    break;
                case "file":
                    data['description'] = vm.childElement.description;
                    break;
                case "plugininstance":
                    data['title'] = vm.childElement.title;
                    break;
                default:
                    console.error("Can not save " + vm.elementType);

                    d.reject();

                    return d.promise;
            }

            // set the title attribute
            if (vm.childElement[vm.elementTitleAttributeName] != vm.elementTitle) {
                data[vm.elementTitleAttributeName] = vm.elementTitle;
            }

            // save the data we collected via a updatePartial (PATCH) rest api call
            vm.elementRestService.updatePartial(data).$promise.then(
                function success (response) {
                    // success
                    vm.childElement = response;
                    d.resolve(vm.childElement);

                    vm.isSaving = false;
                    vm.hasUnsavedChanges = false;
                },
                function error (rejection) {
                    // error
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

        /**
         * Whether the element has scrollbars
         * @returns {boolean}
         */
        vm.contentHasScrollbar = function () {
            if (!vm.contentDomElement) {
                vm.contentDomElement = jQuery($scope.domElement[0].getElementsByClassName('labbook-cell-content'));
            }

            return vm.contentDomElement.hasScrollBar();
        };

        /**
         * Whether the content has a horizontal scrollbar
         * @returns {boolean}
         */
        vm.contentHasHorizontalScrollbar = function () {
            if (!vm.contentDomElement) {
                vm.contentDomElement = jQuery($scope.domElement[0].getElementsByClassName('labbook-cell-content'));
            }

            return vm.contentDomElement.hasHorizontalScrollBar();
        };

        /**
         * Whether the content has a vertical scrollbar
         * @returns {boolean}
         */
        vm.contentHasVerticalScrollbar = function () {
            vm.contentDomElement = jQuery($scope.domElement[0].getElementsByClassName('labbook-cell-content'));

            if (!vm.contentDomElement) {
                return false;
            }

            return vm.contentDomElement.hasVerticalScrollBar();
        };

        vm.positionToolbox = function () {
            var elemPos = jQuery($scope.domElement[0]).offset();
            var toolboxPos = elemPos;
            var elemTop = elemPos['top'];
            var scrollTop = jQuery(window).scrollTop();
            var toolbarHeight = 70;
            var navBarHeight = jQuery('.navbar').height();

            toolboxPos['left'] -= 1; // Toolbox has a 1px wide grey border,

            // position toolbox on top of element as long as it fits above it
            // otherwise place it 100px below the current scrollTop
            if ((elemTop - scrollTop > navBarHeight + toolbarHeight)) {
                toolboxPos['top'] -= toolbarHeight;
            } else {
                toolboxPos['top'] = scrollTop + 100;
            }

            jQuery(".toolbox-container").offset(toolboxPos);
        };
    });
})();
