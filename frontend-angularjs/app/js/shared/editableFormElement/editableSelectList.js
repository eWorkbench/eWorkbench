/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('shared');

    /**
     * @ngdoc directive
     *
     * @name editableSelectList
     *
     * @restrict E
     *
     * @description
     *   Directive editableSelectList, which always renders the provided <select ...></select> list, but changes the
     *   classes on it and enables/disables the save/cancel button
     *
     * @param {} ngModel
     * @param {Boolean} buttonsVisible whether or not the save/cancel buttons should be visible or not
     * @param {Function} onAbort method invoked when the user clicks on the cancel button
     * @param {Function} onSave method invoked when the user clicks on the save button
     * @param {Function} onSaveMultiple method invoked when the user clicks on the save button and there are multiple
     *   unsaved changes
     * @param {Boolean} editDisabled whether edit mode should be disabled
     * @param {string} compareMode how objects should be compared ("date" || "object")
     * @param {string} compareModeDateGranularity ("years" || "months" || "days" || "hours" || "minutes" || "seconds")
     *   if compareMode "date" is used, the granularity for the comparison can be defined with this parameter
     * @param {String} ngModelFields A comma separated list of model fields that should be compared
     */
    module.directive('editableSelectList', function () {
        return {
            restrict: 'E',
            controllerAs: 'vm',
            bindToController: true,
            controller: 'EditableSelectListController',
            transclude: true,
            scope: {
                ngModel: "=", // pass as model (two way binding)
                buttonsVisible: '=?', // optional, whether this view should show the save/cancel button or not
                onAbort: '&?', // callback for on-abort
                onSave: '&', // callback for on-save
                onSaveMultiple: '&?', // callback for on-save-multiple - when there are multiple unsaved changes
                editDisabled: '=?',
                compareMode: '@',
                compareModeDateGranularity: '@',
                ngModelFields: '@'
            },
            compile: function (element, attrs) {
                if (!attrs.compareMode) {
                    attrs.compareMode = "object";
                }
            },
            templateUrl: function (elem, attrs) {
                if (attrs.simpleTemplate) {
                    return 'js/shared/editableFormElement/simpleEditable.html';
                }

                return 'js/shared/editableFormElement/editableSelectList.html';
            }
        };
    });


    module.service('editableFormElementUnsavedChangesService', function () {
        "ngInject";

        var registeredFormElements = [];

        var service = {};

        service.register = function (obj) {
            registeredFormElements.push(obj);
        };

        service.unregister = function (obj) {
            var idx = registeredFormElements.indexOf(obj);

            if (idx >= 0) {
                registeredFormElements.splice(idx, 1);
            } else {
                console.error("editableFormElementService.unregister: could not find obj");
                console.dir(obj);
            }
        };

        /**
         * Checks all registered editable form elements for their current status
         * If there is more than one unsaved object, we warn the user
         * @param currentEl
         */
        service.checkForUnsavedElements = function (currentEl) {
            var len = registeredFormElements.length;

            for (var i = 0; i < len; i++) {
                if (registeredFormElements[i] != currentEl) {
                    // check if this element has unsaved changes
                    // if it has -> return true
                    if (registeredFormElements[i].hasUnsavedChanges()) {
                        return true;
                    }
                }
            }

            return false;
        };

        service.toggleVisibilityForAllUnsavedElements = function () {
            var len = registeredFormElements.length;

            for (var i = 0; i < len; i++) {
                if (registeredFormElements[i].hasUnsavedChanges()) {
                    console.log("Unsaved changes ! toggling...");
                    registeredFormElements[i].toggleButtonVisibility();
                }
            }
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
        editableFormElementUnsavedChangesService,
        gettextCatalog
    ) {
        "ngInject";

        /**
         * Add a listener to the before unload event of the browser. See
         * https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
         * for details
         */
        window.addEventListener('beforeunload', function (event) {
            if (editableFormElementUnsavedChangesService.checkForUnsavedElements(null)) {
                event.returnValue = gettextCatalog.getString(
                    "You have unsaved changes. Are you sure you want to leave this page?"
                );

                return event.returnValue;
            }
            // else: no changes detected, user may leave the page

            return undefined; // need to return undefined here for this to work iN IE
        });

        /**
         * Listen to all transitions
         * If there are unsaved changes, ask the user if they really want to leave
         */
        $transitions.onBefore({}, function (trans) {
            // check for unsaved changes, and then cancel the transition
            if (editableFormElementUnsavedChangesService.checkForUnsavedElements(null)) {
                // tell the user about unsaved changes, and let the user decide
                var modalInstance = $uibModal.open({
                    templateUrl: 'js/shared/editableFormElement/unsavedChanges.html',
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

                console.error("Canceling transition, unsaved changes found!");

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
     * Controller for editableSelectList directive
     */
    module.controller('EditableSelectListController', function (
        $scope,
        $rootScope,
        $q,
        $timeout,
        editableFormElementUnsavedChangesService,
        compareFunctionFactory
    ) {
        "ngInject";

        var vm = this;

        var previousModelState = null;

        var modelFields = null;

        var compareFunction = null;

        this.$onInit = function () {
            vm.resetActive = false;

            if (vm.ngModelFields) {
                modelFields = vm.ngModelFields.split(',');
            }

            /**
             * Initialize Compare Function via compareFunctionFactory
             */
            compareFunction = compareFunctionFactory(
                vm.compareMode, modelFields, vm.compareModeDateGranularity
            );
        };

        vm.hasUnsavedChanges = function () {
            return vm.buttonsVisible == true;
        };

        $scope.$watch("vm.buttonsVisible", function (newVal, oldVal) {
            if (newVal != oldVal && newVal == true) {
                $rootScope.$broadcast("change_detected");
            }
        });

        /**
         * Toggle between editing and not editing
         */
        vm.toggleButtonVisibility = function () {
            vm.buttonsVisible = !vm.buttonsVisible;

            if (vm.buttonsVisible) {
                // store previous model state
                previousModelState = angular.copy(vm.ngModel);
            } else {
                // reset previous model state
                previousModelState = null;
            }
        };

        /**
         * Confirm the current result
         */
        vm.confirm = function () {
            if (vm.isSubmitting) {
                console.log("already submitting, canceling...");

                return;
            }

            // check if there are unsaved changes for any other elements
            if (editableFormElementUnsavedChangesService.checkForUnsavedElements(vm)) {
                console.log("Found multiple unsaved changes! Trying to save them all...");

                if (vm.onSaveMultiple) {
                    vm.submitOnChange = false;

                    vm.isSubmitting = true;

                    vm.onSaveMultiple({}).then(
                        function success (data) {
                            console.log("Save-Multiple succeeded");

                            vm.isSubmitting = false;

                            $timeout(function () {
                                // switch back to view mode for all unsaved elements
                                editableFormElementUnsavedChangesService.toggleVisibilityForAllUnsavedElements();
                            });
                        },
                        function error (rejection) {
                            // error happened... do not do anything
                            console.log("Save-Multiple did not succeed");
                            console.log(rejection);

                            vm.isSubmitting = false;
                        }
                    );

                    return;
                }

                // else: continue with normal save
                console.error("onSaveMultiple is not implemented for this form, just doing a normal save...");
            }

            // save a single item
            vm.submitOnChange = false;

            // store that we are submitting
            vm.isSubmitting = true;

            // call on save and wait for the result
            vm.onSave({ngModel: vm.ngModel}).then(
                function success (data) {
                    console.log("Save succeeded");
                    // switch back to view mode
                    vm.toggleButtonVisibility();

                    vm.isSubmitting = false;
                },
                function error (rejection) {
                    // error happened... do not do anything
                    console.log("Save did not succeed");
                    console.log(rejection);

                    vm.isSubmitting = false;
                }
            );
        };

        /**
         * Cancel editing - resets ngModel to the last known state of ngModel (stored in previousModelState)
         * and calls the onAbort callback (if available)
         */
        vm.cancel = function () {
            // reset only if buttons are visible (this means a change has already happened)
            if (vm.buttonsVisible) {
                console.log("Cancel - resetting ngModel (" + vm.ngModel + ") to " + previousModelState);

                // check if onAbort is set and call it
                $q.when().then(vm.onAbort).then(function cancel () {
                    resetModel();

                    // switch back to view mode
                    vm.toggleButtonVisibility();

                    vm.resetActive = true;
                });
            }
        };

        var resetModel = function () {
            if (vm.ngModelFields && vm.ngModelFields != '') {
                var fieldsToCompare = vm.ngModelFields.split(',');

                for (var i = 0; i < fieldsToCompare.length; i++) {
                    var key = fieldsToCompare[i];

                    vm.ngModel[key] = previousModelState[key];
                }
            } else {
                vm.ngModel = previousModelState;
            }
        };

        /**
         * Watch vm.ngModel - enable edit mode if any changes occur
         */
        $scope.$watch("vm.ngModel", function (newVal, oldVal) {
            // if a reset is active, we do not need to handle anything here
            if (vm.resetActive) {
                vm.resetActive = false;

                return;
            }

            if (compareFunction.compare(previousModelState, newVal) == 0 && previousModelState != null) {
                // it was changed back to the origial model state --> we can disable the buttons
                console.log("!!! model was changed back to original value");
                vm.buttonsVisible = false;

                return;
            }

            var objectHasChanged = compareFunction.compare(oldVal, newVal) != 0;

            var base64WasExtracted = false;

            // check if an image was just extracted from base64 and don't show the buttons then
            if (typeof oldVal === "string" && oldVal.includes("src=\"data:") &&
                typeof newVal === "string" && newVal.includes("/extractedimage/")) {
                base64WasExtracted = true;
            }

            if (objectHasChanged && !base64WasExtracted && !vm.buttonsVisible) {
                // something has changed, enable buttons and store the last model
                console.log("ngModel has changed, enabling buttons...");
                console.log(oldVal);
                console.log(newVal);
                vm.buttonsVisible = true;

                // store previous model state only once
                if (previousModelState == null) {
                    previousModelState = angular.copy(oldVal);
                }
            }

            if (objectHasChanged && vm.submitOnChange) {
                vm.confirm();
            }
        }, true);

        // fix for selectize: If selectize:onSubmit is sent, we can submit this form on the next change
        $scope.$on("selectize:onSubmit", function () {
            console.log("in editableSelectList: onSubmit");
            vm.submitOnChange = true;
        });

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
