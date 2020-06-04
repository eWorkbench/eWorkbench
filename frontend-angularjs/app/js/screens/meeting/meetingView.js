/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Scope stack view for appointment view.
     */
    module.component('meetingView', {
        templateUrl: 'js/screens/meeting/meetingView.html',
        controller: 'MeetingViewController',
        controllerAs: 'vm',
        bindings: {
            'project': '<',
            'meeting': '<'
        }
    });

    /**
     * Small appointment view for dialogs
     */
    module.component('smallMeetingView', {
        templateUrl: 'js/screens/meeting/smallMeetingView.html',
        controller: 'MeetingViewController',
        controllerAs: 'vm',
        bindings: {
            'project': '<',
            'meeting': '<',
            'readOnly': '<'
        }
    });

    /**
     * Appointment Detail View Controller
     *
     * Displays the Appointment Detail View
     */
    module.controller('MeetingViewController', function (
        $scope,
        $q,
        $timeout,
        $uibModal,
        gettextCatalog,
        toaster,
        CalendarConfigurationService,
        ProjectRestService,
        MeetingRestService,
        ResourceRestService,
        ContactRestService,
        IconImagesService,
        PermissionService
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
             * Note Icon
             * @type {string}
             */
            vm.meetingIcon = IconImagesService.mainElementIcons.meeting;

            /**
             * A list of attending user pks
             * @type {Array}
             */
            vm.attendingUsersPk = [];

            /**
             * A list of attending contact pks
             * @type {Array}
             */
            vm.attendingContactsPk = [];

            /**
             * A list of available resources
             * @type {Array}
             */
            vm.resources = [];

            /**
             * gets the correct icons
             */
            vm.editIcon = IconImagesService.mainActionIcons.edit;
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            // copy date picker options for start date and stop date
            vm.datePickerOptionsStartDate = angular.copy(datePickerOptions);
            vm.datePickerOptionsStopDate = angular.copy(datePickerOptions);

            /**
             * Whether the appointment is a full day appointment or not (automatically determined, toggled)
             * @type {boolean}
             */
            vm.isFullDay = false;

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * Whether the element is currently locked or not (determined by vm.onLock and vm.onUnlock)
             * @type {boolean}
             */
            vm.isLocked = false;

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

            updateAttendingUsersAndContacts(vm.meeting);
            vm.checkForFullDayMeeting();
        };

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

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.meeting);
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
                    vm.meeting.date_time_end = vm.setFullDay(vm.meeting.date_time_start);
                } else {
                    // if it is set, set it to the end of the selected day
                    vm.meeting.date_time_end = vm.setFullDay(vm.meeting.date_time_end);
                }

                vm.datePickerOptionsStopDate.format = CalendarConfigurationService.dateFormats.shortFormat;
                vm.datePickerOptionsStartDate.format = CalendarConfigurationService.dateFormats.shortFormat;
            } else {
                vm.datePickerOptionsStopDate.format = CalendarConfigurationService.dateFormats.shortFormatWithHour;
                vm.datePickerOptionsStartDate.format = CalendarConfigurationService.dateFormats.shortFormatWithHour;
            }
        };

        vm.setFullDay = function (moment) {
            // return moment.add(1, 'd').startOf('day');
            return moment.endOf('day');
        };

        /**
         * Checks whether the start_time is start of day and end_time is end of day
         */
        vm.checkForFullDayMeeting = function () {
            vm.isFullDay = vm.checkIsFullDay(vm.meeting.date_time_start, vm.meeting.date_time_end);
            vm.changeFullDay();
        };

        vm.checkIsFullDay = function (start, end) {
            var startIsOnDayStart = moment(start).diff(
                moment(start).startOf("day"),
                'minutes'
            ) === 0;
            var endIsOnDayEnd = moment(end).diff(
                moment(end).endOf("day"),
                'minutes'
            ) === 0;
            /*
            var endIsOnDayStart = moment(end).diff(
                moment(end).startOf("day"),
                'minutes'
            ) === 0;
            var endIs24HoursAwayFromStart = moment(vm.meeting_date_time_start).diff(
                moment(end, 'minutes')
            ) >= 24 * 60;*/

            return startIsOnDayStart && (endIsOnDayEnd /*|| (endIsOnDayStart && endIs24HoursAwayFromStart)*/);
        };

        /**
         * Updates a list of attending user pks and contact pks
         * This is necessary as the list of PKs needs to be a string, but the User PKs are integers
         * Also, it's necessary for data binding reasons
         * @param meeting
         */
        var updateAttendingUsersAndContacts = function (meeting) {
            var i = 0;

            vm.attendingUsersPk.length = 0;
            vm.attendingContactsPk.length = 0;
            vm.projectPks.length = 0;

            if (meeting.attending_users_pk) {
                for (i = 0; i < meeting.attending_users_pk.length; i++) {
                    vm.attendingUsersPk.push(meeting.attending_users_pk[i].toString());
                }
            }

            if (meeting.attending_contacts_pk) {
                for (i = 0; i < meeting.attending_contacts_pk.length; i++) {
                    vm.attendingContactsPk.push(meeting.attending_contacts_pk[i].toString());
                }
            }

            if (meeting.projects) {
                for (i = 0; i < meeting.projects.length; i++) {
                    vm.projectPks.push(meeting.projects[i]);
                }
            }
        };

        /**
         * Loads all available contacts from REST API
         */
        vm.getContacts = function () {
            return ContactRestService.queryCached().$promise.then(
                function success (response) {
                    vm.contacts = response;

                    // also add all contacts that are currently within the appointment
                    for (var i = 0; i < vm.meeting.attending_contacts.length; i++) {
                        vm.contacts.push(vm.meeting.attending_contacts[i]);
                    }
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
         * Reset Appointment Dates by refreshing the object via REST API
         */
        vm.resetMeetingDates = function () {
            meetingDateIsResetting = true;

            return vm.meeting.$get().then(vm.checkForFullDayMeeting);
        };

        /**
         * reset errors
         */
        vm.resetErrors = function () {
            vm.errors = {};
        };

        /**
         * Saves appointment dates via REST API
         */
        vm.saveMeetingDates = function () {
            vm.readOnly = true;
            var data = {
                pk: vm.meeting.pk
            };

            data['date_time_start'] = vm.meeting.date_time_start;
            data['date_time_end'] = vm.meeting.date_time_end;

            vm.resetErrors();

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            MeetingRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateAttendingUsersAndContacts(response);
                    vm.meeting = response;
                    vm.checkForFullDayMeeting();
                    d.resolve();
                },
                function error (rejection) {
                    vm.errors = rejection.data;

                    if (rejection && rejection.data && rejection.data['date_time_start']) {
                        d.reject(rejection.data['date_time_start'].join(", "));
                    } else if (rejection && rejection.data && rejection.data['date_time_end']) {
                        d.reject(rejection.data['date_time_end'].join(", "));
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                        vm.errors['date_time_start'] = [rejection.data.detail];
                        vm.errors['date_time_end'] = [rejection.data.detail];
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Appointment"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                        vm.errors['date_time_start'] = [gettextCatalog.getString("Unknown error")];
                        vm.errors['date_time_end'] = [gettextCatalog.getString("Unknown error")];
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Saves a appointment via REST API as a full update
         */
        vm.saveMeeting = function () {
            vm.readOnly = true;
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            vm.meeting.projects = vm.projectPks;
            vm.meeting.attending_users_pk = vm.attendingUsersPk;
            vm.meeting.attending_contacts_pk = vm.attendingContactsPk;

            vm.resetErrors();

            // update meeting via rest api
            vm.meeting.$update().then(
                function success (response) {
                    updateAttendingUsersAndContacts(response);
                    vm.meeting = response;
                    vm.checkForFullDayMeeting();
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
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                    } else if (rejection.status === 400 && rejection.data['resource']) {
                        // Resource Booking Error
                        d.reject(gettextCatalog.getString("Resource Booking Error"));
                        vm.errors['resource'] = rejection.data['resource'];
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Appointment"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Saves a appointment via REST API partial update
         * @param key
         * @param value
         */
        vm.saveMeetingPartial = function (key, value) {
            vm.readOnly = true;
            // always initialize with primary key
            var data = {
                pk: vm.meeting.pk
            };

            if (value || value === "") {
                data[key] = value;
            } else {
                data[key] = null;
            }

            vm.resetErrors();

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            MeetingRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateAttendingUsersAndContacts(response);
                    vm.meeting = response;
                    vm.checkForFullDayMeeting();
                    d.resolve();
                },
                function error (rejection) {
                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data && rejection.data[key]) {
                        // Validation error - an error message is provided by the api
                        if (typeof (rejection.data[key] === 'object') && rejection.data[key] !== null) {
                            var errMsgs = '';

                            for (var i = 0; i < rejection.data[key].length; i++) {
                                errMsgs += rejection.data[key][i] + ', ';
                            }
                            d.reject(errMsgs);
                        } else {
                            d.reject(rejection.data[key].join(", "));
                        }
                        vm.errors[key] = rejection.data[key];
                    } else if (rejection.data.non_field_errors) {
                        // non_field_error occured (e.g., object has already been trashed/soft-deleted) and can
                        // therefore no longer be edited
                        d.reject(rejection.data.non_field_errors);
                        vm.errors[key] = rejection.data.non_field_errors;
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                        vm.errors[key] = [rejection.data.detail];
                    } else if (rejection.status === 400 && rejection.data['resource']) {
                        // Resource Booking Error
                        d.reject(gettextCatalog.getString("Resource Booking Error"));
                        vm.errors['resource'] = rejection.data['resource'];
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Appointment"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                        vm.errors[key] = [gettextCatalog.getString("Unknown error")];
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };
    });
})();
