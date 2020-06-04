/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for creating a appointment-create modal dialog
     */
    module.service('ResourceBookingCreateEditModalService', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the create modal dialog
         * @returns {$uibModalInstance}
         */
        service.openCreate = function (template, resource, isStudyRoom) {
            if (isStudyRoom == undefined) {
                isStudyRoom = false;
            }

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
                    },
                    isStudyRoom: function () {
                        return isStudyRoom
                    }
                }
            });
        };

        /**
         * Opens the edit modal dialog
         * @returns {$uibModalInstance}
         */
        service.openEdit = function (booking, isStudyRoom) {
            if (isStudyRoom == undefined) {
                isStudyRoom = false;
            }

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
                    },
                    isStudyRoom: function () {
                        return isStudyRoom;
                    }
                }
            });
        };

        return service;
    });

    /**
     * Appointment Create Controller
     *
     * Displays the appointment create form
     */
    module.controller('ResourceBookingCreateEditModalController', function (
        $rootScope,
        $scope,
        $q,
        $state,
        $timeout,
        $uibModalInstance,
        AuthRestService,
        ContactRestService,
        MeetingRestService,
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
        isEditing,
        isStudyRoom
    ) {
        'ngInject';

        var vm = this;

        /**
         * Whether appointment start_date and/or stop_date are currently being reset
         * (e.g., because of a $resource query)
         * @type {boolean}
         */
        var meetingDateIsResetting = false;

        this.$onInit = function () {
            vm.meeting = template;

            /**
             * Whether this modal dialog is meant for editing or not
             * @type {boolean}
             */
            vm.isEditing = isEditing;

            /**
             * Whether this modal dialog is for study room booking or not
             * @type {boolean}
             */
            vm.isStudyRoom = isStudyRoom;

            vm.resource = resource;

            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

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
             * A list of attending user pks
             * @type {Array}
             */
            vm.attendingUsersPk = [];

            /**
             * A list of attending contacts
             * @type {Array}
             */
            vm.attendingContactsPk = [];

            /**
             * A list of available resources
             * @type {Array}
             */
            vm.resources = [];

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
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * Add current project
             */
            if (ProjectSidebarService.project) {
                vm.projectPks.push(ProjectSidebarService.project.pk);
            }

            /**
             * when template is not null the data of the template object should
             * be shown in the modal view else the default data
             */
            if (template) {
                vm.meeting = template;
                if (!vm.meeting.title) {
                    vm.meeting.title = "Appointment";
                }
                if (resource) {
                    vm.meeting.resource_pk = resource.pk;
                }
                vm.projectPks = vm.meeting.projects;
                vm.attendingContactsPk = vm.meeting.attending_contacts_pk;
                vm.attendingUsersPk = vm.meeting.attending_users_pk;
                vm.location = vm.meeting.location;
                vm.isFullDay = vm.meeting.full_day;
                if (vm.meeting.full_day) {
                    vm.datePickerOptionsStopDate.format = CalendarConfigurationService.dateFormats.shortFormat;
                    vm.datePickerOptionsStartDate.format = CalendarConfigurationService.dateFormats.shortFormat;
                }
                // vm.meeting.full_day has served it's purpose and is not need in the backend, so delete it
                delete vm.meeting.full_day;
            } else {
                vm.meeting = {
                    date_time_start: moment().startOf('hour').add(1, 'h'), // set start_date to current date + 1 hour
                    date_time_end: moment().startOf('hour').add(2, 'h'), // set due_date to start_date + 2 hours
                    title: "Appointment",
                    resource_pk: resource.pk
                };
            }

            /**
             * On any change of date_time_start, adapt date_time_end accordingly.
             * This is accomplished by calculating the time difference in minutes from the original date_time_start and
             * the new date_time_start, and adding exatly that value to date_time_end
             */
            $scope.$watch('vm.meeting.date_time_start', function (newVal, oldVal) {
                if (!meetingDateIsResetting) {
                    // date_time_end needs to have a min_date of the current date
                    vm.datePickerOptionsStopDate.minDate = vm.meeting.date_time_start;

                    // calculate the difference in minutes between the old value and new value of start_date
                    var diffMinutes = moment(newVal).diff(moment(oldVal), 'minutes');

                    // apply this difference to the date_time_end
                    $timeout(function () {
                        vm.meeting.date_time_end = moment(vm.meeting.date_time_end).add(diffMinutes, 'minutes');

                        // if this is a full day appointment, make sure to "round" date_time_end to the end of the day
                        if (vm.isFullDay) {
                            vm.meeting.date_time_end = moment(vm.meeting.date_time_end).endOf("day");
                        }
                    });
                } else {
                    meetingDateIsResetting = false;
                }
            });

            $q.when()
                .then(vm.getContacts)
                .then(vm.getResources);
        };

        /**
         Removes the resource and saves the appointment
         */
        vm.deleteResourceBooking = function () {
            vm.meeting.resource = null;
            vm.meeting.resource_pk = null;
            vm.create();
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return !PermissionService.has('object.edit', vm.meeting);
        };

        /**
         * Called when the full day checkbox is clicked
         */
        vm.changeFullDay = function () {
            if (vm.isFullDay) {
                // get selected start time and get end of day
                vm.meeting.date_time_start = moment(vm.meeting.date_time_start).startOf("day");
                // if date time end is not set, set it to the end of the selected day
                if (!vm.meeting.date_time_end) {
                    vm.meeting.date_time_end = moment(vm.meeting.date_time_start).endOf("day");
                } else {
                    // if it is set, set it to the end of the selected day
                    vm.meeting.date_time_end = moment(vm.meeting.date_time_end).endOf("day");
                }

                vm.datePickerOptionsStopDate.format = CalendarConfigurationService.dateFormats.shortFormat;
                vm.datePickerOptionsStartDate.format = CalendarConfigurationService.dateFormats.shortFormat;
            } else {
                vm.datePickerOptionsStopDate.format = CalendarConfigurationService.dateFormats.shortFormatWithHour;
                vm.datePickerOptionsStartDate.format = CalendarConfigurationService.dateFormats.shortFormatWithHour;
            }
        };

        /**
         * Loads all available contacts from REST API
         */
        vm.getContacts = function () {
            return ContactRestService.queryCached().$promise.then(
                function success (response) {
                    vm.contacts = response;
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to load contacts"));
                }
            )
        };

        /**
         * Gets a list of available resources
         */
        vm.getResources = function () {
            return ResourceRestService.queryCached().$promise.then(
                function success (response) {
                    vm.resources = response;
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to get Resources"));
                }
            );
        };

        /**
         * On Create
         * Calls REST API to create a new contact and redirects to contact/view on success
         */
        vm.create = function () {
            // assign users and contacts to the appointment object
            vm.meeting.attending_users_pk = vm.attendingUsersPk;
            vm.meeting.attending_contacts_pk = vm.attendingContactsPk;
            vm.meeting.projects = vm.projectPks;
            vm.errors = {};

            if (vm.isEditing) {
                if (!vm.meeting.resource_pk) {
                    vm.meeting.resource_pk = "";
                }
                // update resource booking via REST API
                MeetingRestService.updatePartial(vm.meeting).$promise.then(
                    function success (response) {
                        $rootScope.$emit("resource-booked");
                        vm.meeting = response;
                        toaster.pop('success', gettextCatalog.getString("Appointment edited"));

                        // $uibModalInstance.close(vm.resource_pk.pk);
                        $uibModalInstance.close(vm.meeting.pk);
                    },
                    function error (rejection) {
                        // On error we need to check which kind of error we got
                        toaster.pop('error', gettextCatalog.getString("Failed to edit appointment"));
                        console.log(rejection);
                        vm.errors = rejection.data;

                        // handle permission denied errors
                        if (rejection.status == 403) {
                            // permission denied -> this is most likely due to the fact that the user does not have the
                            // appropriate permissions in the selected project
                            if (vm.meeting.projects && vm.meeting.projects.length > 0) {
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new appointment in at least one of the " +
                                        "specified projects"
                                    )
                                ];
                            } else {
                                // permission denied -> user must select a project
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new appointment without selecting a project"
                                    )
                                ];
                            }
                        }
                    }
                );
            } else {
                MeetingRestService.create(vm.meeting).$promise.then(
                    function success (response) {
                        $rootScope.$emit("resource-booked");
                        vm.meeting = response;
                        toaster.pop('success', gettextCatalog.getString("Appointment created"));

                        $uibModalInstance.close(response);
                    },
                    function error (rejection) {
                        // On error we need to check which kind of error we got
                        toaster.pop('error', gettextCatalog.getString("Failed to create appointment"));
                        console.log(rejection);
                        vm.errors = rejection.data;

                        // handle permission denied errors
                        if (rejection.status == 403) {
                            // permission denied -> this is most likely due to the fact that the user does not have the
                            // appropriate permissions in the selected project
                            if (vm.meeting.projects && vm.meeting.projects.length > 0) {
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new appointment in at least one of the " +
                                        "specified projects"
                                    )
                                ];
                            } else {
                                // permission denied -> user must select a project
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new appointment without selecting a project"
                                    )
                                ];
                            }
                        }
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
    });
})();
