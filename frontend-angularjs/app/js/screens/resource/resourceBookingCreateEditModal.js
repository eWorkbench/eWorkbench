/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Service for resource booking modal dialogs
     */
    module.service('ResourceBookingCreateEditModalService', function (
        $window,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the create modal dialog
         * @returns {$uibModalInstance}
         */
        service.openCreate = function (template, resource) {
            return $uibModal.open({
                templateUrl: 'js/screens/resource/resourceBookingCreateEditModal.html',
                controller: 'ResourceBookingCreateEditModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    isEditing: function () {
                        return false;
                    },
                    template: function () {
                        return template;
                    },
                    resource: function () {
                        return resource;
                    }
                }
            });
        };

        /**
         * Opens the edit modal dialog
         * @returns {$uibModalInstance}
         */
        service.openEdit = function (booking) {
            return $uibModal.open({
                templateUrl: 'js/screens/resource/resourceBookingCreateEditModal.html',
                controller: 'ResourceBookingCreateEditModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    isEditing: function () {
                        return true;
                    },
                    template: function () {
                        return booking;
                    },
                    resource: function () {
                        return booking.resource;
                    }
                }
            });
        };

        return service;
    });

    module.controller('ResourceBookingCreateEditModalController', function (
        $rootScope,
        $scope,
        $q,
        $state,
        $timeout,
        $uibModalInstance,
        AuthRestService,
        MeetingRestService,
        ResourceBookingsRestService,
        CalendarConfigurationService,
        ResourceRestService,
        ProjectSidebarService,
        IconImagesService,
        PermissionService,
        gettextCatalog,
        toaster,
        confirmDialogWidget,
        // injected by modal:
        template,
        resource,
        isEditing
    ) {
        'ngInject';

        var
            vm = this;

        /**
         * Whether resourcebooking start_date and/or stop_date are currently being reset
         * (e.g., because of a $resource query)
         * @type {boolean}
         */
        var resourceBookingDateIsResetting = false;

        this.$onInit = function () {
            /**
             * Whether this modal dialog is meant for editing or not
             * @type {boolean}
             */
            vm.isEditing = isEditing;

            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            vm.resource = resource;
            vm.resourceName = vm.resource.name;
            vm.resource_pk = vm.resource;

            /**
             * Configuration of the datepicker.
             * @type {Object}
             */
            var datePickerOptions = CalendarConfigurationService.getOptions({
                widgetPositioning: {horizontal: 'right', vertical: 'bottom'},
                allowInputToggle: true,
                showTodayButton: true
            });

            /**
             * A list of available meetings
             * @type {Array}
             */
            vm.meetings = [];

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * gets the correct icons
             */
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            // copy date picker options for start date and stop date
            vm.datePickerOptionsStartDate = angular.copy(datePickerOptions);
            vm.datePickerOptionsStopDate = angular.copy(datePickerOptions);

            /**
             * marks that we are in create mode
             * @type {boolean}
             */
            vm.mode = 'create';

            /**
             * when template is not null the data of the template object should
             * be shown in the modal view else the default data
             */
            if (template) {
                vm.resourcebooking = template;
                // needed for the calendar modal
                vm.resourcebooking.meeting_pk = template.meeting ? template.meeting.pk : null;
                vm.meeting = vm.resourcebooking.meeting_pk;
                vm.resource = vm.resourcebooking.resource_pk;
                vm.comment = vm.resourcebooking.comment;
            } else {
                vm.resourcebooking = {
                    resource_pk: vm.resource_pk,
                    // set start_date to current date + 1 hour
                    date_time_start: moment().startOf('hour').add(1, 'h'),
                    // set due_date to start_date + 2 hours
                    date_time_end: moment().startOf('hour').add(2, 'h')
                };
            }

            /**
             * On any change of date_time_start, adapt date_time_end accordingly.
             * This is accomplished by calculating the time difference in minutes from the original date_time_start and
             * the new date_time_start, and adding exatly that value to date_time_end
             */
            $scope.$watch('vm.resourcebooking.date_time_start', function (newVal, oldVal) {
                if (!resourceBookingDateIsResetting) {
                    // date_time_end needs to have a min_date of the current date
                    vm.datePickerOptionsStopDate.minDate = vm.resourcebooking.date_time_start;

                    // calculate the difference in minutes between the old value and new value of start_date
                    var diffMinutes = moment(newVal).diff(moment(oldVal), 'minutes');

                    // apply this difference to the date_time_end
                    $timeout(function () {
                        vm.resourcebooking.date_time_end = moment(vm.resourcebooking.date_time_end)
                            .add(diffMinutes, 'minutes');
                    });
                } else {
                    resourceBookingDateIsResetting = false;
                }
            });

            $q.when().then(vm.getMeetings);
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            // TODO: implement
            // return !PermissionService.has('object.edit', vm.resourcebooking);
        };

        /**
         * Gets a list of available meetings
         */
        vm.getMeetings = function () {
            return MeetingRestService.queryCached().$promise.then(
                function success (response) {
                    vm.meetings = response;
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to get Meetings"));
                }
            );
        };

        /**
         * On Create
         * Calls REST API to create or edit a resourcebooking
         */
        vm.save = function () {
            vm.resourcebooking.resource_pk = vm.resource_pk.pk;
            if (!vm.resourcebooking.meeting_pk) {
                vm.resourcebooking.meeting_pk = null;
                vm.resourcebooking.meeting = null;
            }
            vm.errors = {};

            if (vm.isEditing) {
                // update resource booking via REST API
                ResourceBookingsRestService.updatePartial(vm.resourcebooking).$promise.then(
                    function success (response) {
                        $rootScope.$emit("resource-booked");
                        vm.resourcebooking = response;
                        toaster.pop('success', gettextCatalog.getString("Booking edited"));

                        $uibModalInstance.close(vm.resource_pk.pk);
                    },
                    function error (rejection) {
                        // On error we need to check which kind of error we got
                        toaster.pop('error', gettextCatalog.getString("Failed to create ResourceBooking"));
                        console.log(rejection);
                        vm.errors = rejection.data;
                    }
                );
            } else {
                // create (also rebook) resource booking via REST API
                ResourceBookingsRestService.create(vm.resourcebooking).$promise.then(
                    function success (response) {
                        $rootScope.$emit("resource-booked");
                        vm.resourcebooking = response;
                        toaster.pop('success', gettextCatalog.getString("Resource Booked"));

                        $uibModalInstance.close(vm.resource_pk.pk);
                    },
                    function error (rejection) {
                        // On error we need to check which kind of error we got
                        toaster.pop('error', gettextCatalog.getString("Failed to create ResourceBooking"));
                        console.log(rejection);
                        vm.errors = rejection.data;
                    }
                )
            }
        };

        /**
         * Dismiss the modal dialog
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };

        /**
         * On delete button click present a modal dialog that asks the user whether to really delete
         * the ResourceBooking or not
         * @returns {*}
         */
        vm.deleteResourceBooking = function () {
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Delete Resource Booking?'),
                message: gettextCatalog.getString('Do you really want to delete this booking for ') +
                    vm.resourcebooking.resource.name + '?',
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Delete'),
                dialogKey: 'DeleteResourceBooking'
            });

            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        ResourceBookingsRestService.delete(vm.resourcebooking).$promise.then(
                            function success (response) {
                                toaster.pop('success', gettextCatalog.getString("Deleted"));
                                $rootScope.$broadcast('objectDeletedEvent');
                                $uibModalInstance.close(false);
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
    });
})();
