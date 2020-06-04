/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Widget that shows the element state (mainly, whether the element has been trashed or not)
     */
    module.directive('resourceMetaDataWidget', function () {
        return {
            restrict: 'E',
            controller: 'resourceMetaDataWidgetController',
            templateUrl: 'js/widgets/resourceMetaDataWidget/resourceMetaDataWidget.html',
            scope: {
                resource: '=',
                readOnly: '=',
                disableHistory: '='
            },
            replace: true,
            bindToController: true,
            controllerAs: 'vm'
        };
    });

    module.controller('resourceMetaDataWidgetController', function (
        $scope,
        $q,
        gettextCatalog,
        ResourceRestService,
        ResourceConverterService,
        toaster,
        selectFileWithPicker,
        IconImagesService,
        PermissionService,
        confirmDialogWidget,
        $timeout,
        editableFormElementUnsavedChangesService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            /**
             * get the correct icons
             */
            vm.editIcon = IconImagesService.mainActionIcons.edit;
            vm.deleteIcon = IconImagesService.mainActionIcons.delete;
            vm.addIcon = IconImagesService.mainActionIcons.add;
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * This is a helper variable that helps to determine
             * if during initialization there was a correct terms of use pdf or not
             * @type {boolean}
             */
            vm.emptyPDF = vm.resource.terms_of_use_pdf === null;

            /**
             * A list of assigned user PKs
             * @type {Array}
             */
            vm.selectedUsersPks = [];
            updateSelectedUsersPks(vm.resource);

            /**
             * A list of assigned usergroup PKs
             * @type {Array}
             */
            vm.selectedUserGroupsPks = [];
            updateSelectedUserGroupsPks(vm.resource);

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];
            updateProjectPks(vm.resource);
        };

        /**
         * Returns true if a resource is globally available
         */
        vm.isGloballyAvailable = function () {
            return vm.resource.user_availability === "GLB";
        };

        /**
         * Returns true if a resource is available for project members
         */
        vm.isAvailableForProjectMembers = function () {
            return vm.resource.user_availability === "PRJ";
        };

        /**
         * Returns true if a resource is available for selected users
         */
        vm.isAvailableForSelectedUsers = function () {
            return vm.resource.user_availability === "USR";
        };

        /**
         * Button for uploading a new file
         */
        vm.uploadNewFile = function () {
            selectFileWithPicker().then(
                function fileSelected (file) {
                    vm.saveResource(file);
                }
            );
        };

        /**
         * Button for deleting the terms of use pdf
         */
        vm.deleteFile = function () {
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Delete?'),
                message: gettextCatalog.getString('Do you really want to delete this terms of use PDF'),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Delete'),
                dialogKey: 'DeleteTermsOfUsePdf'
            });

            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        vm.saveResource(null).then(
                            function success (response) {
                                toaster.pop('success', gettextCatalog.getString("Deleted"));
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
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.resource);
        };

        /**
         * Save a resource via REST API as a full update
         */
        vm.saveResource = function (file) {
            vm.readOnly = true;
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            vm.resource.projects = vm.projectPks;

            vm.resource.user_availability_selected_user_pks = vm.selectedUsersPks;

            vm.resource.user_availability_selected_user_group_pks = vm.selectedUserGroupsPks;

            // if there is a terms_of_use_pdf set we won't try to update it here as it would just
            // error as the url reference is not a file
            if (vm.resource.terms_of_use_pdf) {
                delete vm.resource.terms_of_use_pdf;
            }

            // when saving/updating the terms_of_use_pdf-file we have to check if there is a file
            // or if the file is null for deleting of the file
            // then we also have to reset the edit buttons in this case as they wouldn't go away otherwise
            // the content in all edited fields is saved
            if (file || file === null) {
                vm.resource.terms_of_use_pdf = file;
                $timeout(function () {
                    // switch back to view mode for all unsaved elements
                    editableFormElementUnsavedChangesService.toggleVisibilityForAllUnsavedElements();
                });
            }

            vm.resource.$update().then(
                function success (response) {
                    updateProjectPks(response);
                    updateSelectedUsersPks(response);
                    updateSelectedUserGroupsPks(response);
                    // worked
                    vm.resource = response;
                    vm.emptyPDF = false;
                    vm.errors = {};
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

                        if (vm.errors["terms_of_use_pdf"] && vm.emptyPDF) {
                            vm.resource.terms_of_use_pdf = null;
                            // it solves the problem of not rendering the Terms of Use(PDF)
                            // when a wrong media type was uploaded
                            vm.readOnly = true;
                        }
                    } else if (rejection.status === 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Resource"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Saves a resource via REST API partial update
         * @param key
         * @param value
         */
        vm.saveResourcePartial = function (key, value) {
            vm.readOnly = true;
            // always initialize with primary key
            var data = {
                pk: vm.resource.pk
            };

            data[key] = value;

            // reset errors
            vm.errors = {};
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            ResourceRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    updateSelectedUsersPks(response);
                    updateSelectedUserGroupsPks(response);
                    vm.resource = response;
                    // worked
                    d.resolve();
                    toaster.pop('success', "Resource updated");
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
                        toaster.pop('error', gettextCatalog.getString("Failed to update Resource"));
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
         * Updates the list of assigned user pks
         * This is necessary as the list of PKs needs to be a string, but the User PKs are integers
         * @param resource
         */
        var updateSelectedUsersPks = function (resource) {
            vm.selectedUsersPks.length = 0;
            // convert all assigned user PKs to strings
            if (resource.user_availability_selected_user_pks) {
                for (var i = 0; i < resource.user_availability_selected_user_pks.length; i++) {
                    vm.selectedUsersPks.push(resource.user_availability_selected_user_pks[i].toString());
                }
            }
        };

        /**
         * Updates the list of assigned usergroup pks
         * This is necessary as the list of PKs needs to be a string, but the UserGroup PKs are integers
         * @param resource
         */
        var updateSelectedUserGroupsPks = function (resource) {
            vm.selectedUserGroupsPks.length = 0;
            // convert all assigned usergroup PKs to strings
            if (resource.user_availability_selected_user_group_pks) {
                for (var i = 0; i < resource.user_availability_selected_user_group_pks.length; i++) {
                    vm.selectedUserGroupsPks.push(resource.user_availability_selected_user_group_pks[i].toString());
                }
            }
        };

        /**
         * Updates a list of project pks
         * This is necessary as the list of PKs has a different reference, and the angular $watchGroup does not allow
         * to watch for array changes
         * @param resource
         */
        var updateProjectPks = function (resource) {
            vm.projectPks.length = 0;
            if (resource.projects) {
                for (var i = 0; i < resource.projects.length; i++) {
                    vm.projectPks.push(resource.projects[i]);
                }
            }
        };

        /**
         * Resets the booking rules settings
         */
        vm.resetBookingRulesOnResourceObject = function () {
            vm.resource.booking_rule_minimum_duration = null;
            vm.resource.booking_rule_maximum_duration = null;
            vm.resource.booking_rule_bookable_hours = null;
            vm.resource.booking_rule_minimum_time_before = null;
            vm.resource.booking_rule_maximum_time_before = null;
            vm.resource.booking_rule_time_between = null;
            vm.resource.booking_rule_bookings_per_user = [];
        };

        /**
         * Updates the booking rules settings
         * @param rules
         */
        vm.updateBookingRulesOnResourceObject = function (rules) {
            angular.forEach(rules, function (rule) {
                switch (rule.criterion) {
                    case 'booking_rule_minimum_duration':
                        vm.resource.booking_rule_minimum_duration = {
                            'id': rule.id || null,
                            'duration': rule.value + ':00'
                        };
                        break;
                    case 'booking_rule_maximum_duration':
                        vm.resource.booking_rule_maximum_duration = {
                            'id': rule.id || null,
                            'duration': rule.value + ':00'
                        };
                        break;
                    case 'booking_rule_bookable_hours':
                        vm.resource.booking_rule_bookable_hours = {
                            'id': rule.id || null,
                            'monday': rule.monday,
                            'tuesday': rule.tuesday,
                            'wednesday': rule.wednesday,
                            'thursday': rule.thursday,
                            'friday': rule.friday,
                            'saturday': rule.saturday,
                            'sunday': rule.sunday,
                            'time_start': rule.time_start + ':00',
                            'time_end': rule.time_end + ':00'
                        };
                        break;
                    case 'booking_rule_minimum_time_before':
                        vm.resource.booking_rule_minimum_time_before = {
                            'id': rule.id || null,
                            'duration': rule.value + ':00'
                        };
                        break;
                    case 'booking_rule_maximum_time_before':
                        vm.resource.booking_rule_maximum_time_before = {
                            'id': rule.id || null,
                            'duration': rule.value + ':00'
                        };
                        break;
                    case 'booking_rule_time_between':
                        vm.resource.booking_rule_time_between = {
                            'id': rule.id || null,
                            'duration': rule.value + ':00'
                        };
                        break;
                    case 'booking_rule_bookings_per_user':
                        vm.resource.booking_rule_bookings_per_user.push({
                            'id': rule.id || null,
                            'count': rule.value,
                            'unit': rule.unit
                        });
                        break;
                    default:
                        console.log('Unknown criterion for rule: ' + rule.criterion);
                        break;
                }
            });
        };

        /**
         * Listen on parent scope to perform save for resource-booking-rules-widget.
         */
        $scope.$parent.$on('saveResourceBookingRules', function (event, data) {
            vm.resetBookingRulesOnResourceObject();
            vm.updateBookingRulesOnResourceObject(data);
            vm.saveResource();
        });
    });
})();
