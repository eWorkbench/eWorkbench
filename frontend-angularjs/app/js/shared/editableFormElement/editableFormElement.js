/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('shared');

    /**
     * Directive editableFormElement, which allows to toggle between a view- and edit-mode of the provided ngModel
     * This directive has two transclusions, <view></view> and <edit></edit>
     */
    module.directive('editableFormElement', function () {
        return {
            restrict: 'E',
            controllerAs: 'vm',
            bindToController: true,
            controller: 'EditableFormElementController',
            transclude: {
                // optional transclusion view (default: ngModel)
                'view': '?view',
                // required transclusion edit - the edit field
                'edit': 'edit'
            },
            scope: {
                ngModel: "=", // pass as model (two way binding)
                isEditing: '=?', // optional, whether this view is currently set to editing or not
                onAbort: '&?', // callback for on-abort
                onSave: '&', // callback for on-save
                onSaveMultiple: '&?', // callback for on-save-multiple - when there are multiple unsaved changes
                editDisabled: '=?'
            },
            templateUrl: 'js/shared/editableFormElement/editableFormElement.html'
        };
    });

    /**
     * Controller for editableFormElement directive
     */
    module.controller('EditableFormElementController', function (
        $scope,
        $rootScope,
        $timeout,
        editableFormElementUnsavedChangesService
    ) {
        "ngInject";

        var vm = this;

        var previousModelState = null;

        /**
         * Toggle between editing and not editing
         */
        vm.toggleEdit = function () {
            if (!vm.editDisabled) {
                vm.isEditing = !vm.isEditing;

                if (vm.isEditing) {
                    previousModelState = angular.copy(vm.ngModel);
                }
            }

            // must return false here, so we do not "pass" the focus or click event to the below elements
            return false;
        };

        vm.toggleButtonVisibility = function () {
            vm.toggleEdit();
        };

        vm.hasUnsavedChanges = function () {
            return (vm.isEditing === true);
        };

        $scope.$watch("vm.isEditing", function (newVal, oldVal) {
            if (newVal != oldVal && newVal == true) {
                $rootScope.$broadcast("change_detected");
            }
        });

        /**
         * Confirm the current result
         */
        vm.confirm = function () {
            // check if there are unsaved changes for any other elements
            if (editableFormElementUnsavedChangesService.checkForUnsavedElements(vm)) {
                console.log("Found multiple unsaved changes! Trying to save them all...");

                if (vm.onSaveMultiple) {
                    vm.submitOnChange = false;

                    vm.onSaveMultiple({}).then(
                        function success (data) {
                            console.log("Save-Multiple succeeded");

                            $timeout(function () {
                                // switch back to view mode for all unsaved elements
                                editableFormElementUnsavedChangesService.toggleVisibilityForAllUnsavedElements();
                            });
                        },
                        function error (rejection) {
                            // error happened... do not do anything
                            console.log("Save-Multiple did not succeed");
                            console.log(rejection);
                        }
                    );

                    return;
                }

                // else: continue with normal save
                console.error("onSaveMultiple is not implemented for this form, just doing a normal save...");
            }

            // call on save and wait for the result
            vm.onSave({ngModel: vm.ngModel}).then(
                function success (data) {
                    console.log("Save succeeded");
                    // switch back to view mode
                    vm.toggleEdit();
                },
                function error (rejection) {
                    // error happened... do not do anything
                    console.log("Save did not succeed");
                    console.log(rejection);
                }
            );
        };

        /**
         * Cancel editing - resets ngModel to the last known state of ngModel (stored in previousModelState)
         * and calls the onAbort callback (if available)
         */
        vm.cancel = function () {
            vm.ngModel = previousModelState;
            // check if onAbort is set and call it
            if (vm.onAbort) {
                vm.onAbort();
            }
            // switch back to view mode
            vm.toggleEdit();
        };

        /**
         * Unregister on $destroy
         */
        $scope.$on("$destroy", function () {
            editableFormElementUnsavedChangesService.unregister(vm);
        });

        /**
         * Register element
         */
        editableFormElementUnsavedChangesService.register(vm);
    });
})();
