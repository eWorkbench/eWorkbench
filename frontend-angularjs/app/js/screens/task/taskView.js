/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Scope stack view for projects and corresponding entities.
     */
    module.component('taskView', {
        templateUrl: 'js/screens/task/taskView.html',
        controller: 'TaskViewController',
        controllerAs: 'vm',
        bindings: {
            'task': '<'
        }
    });

    /**
     * Scope stack view for projects and corresponding entities.
     */
    module.component('smallTaskView', {
        templateUrl: 'js/screens/task/smallTaskView.html',
        controller: 'TaskViewController',
        controllerAs: 'vm',
        bindings: {
            'task': '<',
            'readOnly': '<'
        }
    });

    /**
     * Task Overview Controller
     *
     * Displays the Tasks Overview
     */
    module.controller('TaskViewController', function (
        $scope,
        $timeout,
        $q,
        PermissionService,
        TaskRestService,
        UserRestService,
        toaster,
        TaskConverterService,
        TaskKanbanboardColumnRestService,
        gettextCatalog,
        CalendarConfigurationService,
        IconImagesService
    ) {
        'ngInject';

        var vm = this;

        /**
         * Whether task start_date and/or due_date are currently being reset (e.g., because of a $resource query)
         * @type {boolean}
         */
        var taskDateIsResetting = false;

        this.$onInit = function () {
            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * Task Icon
             * @type {string}
             */
            vm.taskIcon = IconImagesService.mainElementIcons.task;

            /**
             * Task Type Service
             */
            vm.taskConverterService = TaskConverterService;

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
             * gets the correct icons
             */
            vm.editIcon = IconImagesService.mainActionIcons.edit;

            // copy date picker options for start date and stop date
            vm.datePickerOptionsStartDate = angular.copy(datePickerOptions);
            vm.datePickerOptionsStopDate = angular.copy(datePickerOptions);

            /**
             * The initial user array for the assignable users of a task - needed for selectize to be pre-initialized
             * As there is no project selected, we do not allow this to be filled (except for the current selected user)
             * @type {Array}
             */
            vm.initialUserArray = [vm.task.assigned_user];

            /**
             * A list of assigned user PKs
             * @type {Array}
             */
            vm.assignedUserPks = [];

            /**
             * Whether the task is a full day task or not (automatically determined, toggled)
             * @type {boolean}
             */
            vm.isFullDay = false;

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * A list of kanban board assignments for this element
             * @type {Array}
             */
            vm.kanbanBoardAssignments = [];

            /**
             * Whether the element is currently locked or not (determined by vm.onLock and vm.onUnlock)
             * @type {boolean}
             */
            vm.isLocked = false;

            /**
             * On any change of start_date, adapt stop_date
             * This is accomplished by calculating the time difference
             * in minutes from the original start_date and the new
             * start_date, and adding exactly that value to stop_date
             */
            $scope.$watch('vm.task.start_date', function (newVal, oldVal) {
                if (!taskDateIsResetting) {
                    if (vm.task.start_date) {
                        // due_date needs to have a min_date of the current date
                        vm.datePickerOptionsStopDate.minDate = vm.task.start_date;

                        // only continue if due_date is also set
                        if (vm.task.due_date) {
                            var diffMinutes = 0;

                            if (oldVal) {
                                // calculate the difference in minutes between the old value and new value of start_date
                                diffMinutes = moment(newVal).diff(moment(oldVal), 'minutes');
                            } else {
                                diffMinutes = moment(newVal).diff(moment(vm.task.due_date), 'minutes') + 1;

                                if (diffMinutes < 0) {
                                    diffMinutes = 0;
                                }
                            }

                            if (diffMinutes) {
                                // apply this difference to the due_date
                                $timeout(function () {
                                    vm.task.due_date = moment(vm.task.due_date).add(diffMinutes, 'minutes');

                                    // if this is a full day task, make sure to "round" due_date to the end of the day
                                    if (vm.isFullDay) {
                                        vm.task.due_date = moment(vm.task.due_date).endOf("day");
                                    }
                                });
                            }
                        }
                    } else {
                        vm.datePickerOptionsStopDate.minDate = moment('1970-01-01');
                    }
                } else {
                    taskDateIsResetting = false;
                }
            });
            updateAssignedUserPks(vm.task);
            updateKanbanBoardAssignments(vm.task);
            updateProjectPks(vm.task);

            vm.checkForFullDayTask();
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
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.task);
        };

        /**
         * Called when the full day checkbox is clicked
         */
        vm.changeFullDay = function () {
            if (vm.isFullDay) {
                // get selected start time and get end of day
                vm.task.start_date = moment(vm.task.start_date).startOf("day");
                // if date time end is not set, set it to the end of the selected day
                if (!vm.task.due_date) {
                    vm.task.due_date = moment(vm.task.start_date).endOf("day");
                } else {
                    // if it is set, set it to the end of the selected day
                    vm.task.due_date = moment(vm.task.due_date).endOf("day");
                }

                vm.datePickerOptionsStopDate.format = CalendarConfigurationService.dateFormats.shortFormat;
                vm.datePickerOptionsStartDate.format = CalendarConfigurationService.dateFormats.shortFormat;
            } else {
                vm.datePickerOptionsStopDate.format = CalendarConfigurationService.dateFormats.shortFormatWithHour;
                vm.datePickerOptionsStartDate.format = CalendarConfigurationService.dateFormats.shortFormatWithHour;
            }
        };

        /**
         * Checks whether the start_date is start of day and due_date is end of day
         */
        vm.checkForFullDayTask = function () {
            var start_diff = moment(vm.task.start_date).diff(moment(vm.task.start_date).startOf("day"), 'minutes');
            var end_diff = moment(vm.task.due_date).diff(moment(vm.task.due_date).endOf("day"), 'minutes');

            vm.isFullDay = (start_diff == 0 && end_diff == 0);

            vm.changeFullDay();
        };

        /**
         * Reset Task Dates by refreshing the object via REST API
         */
        vm.resetTaskDates = function () {
            // reset potential errors
            vm.resetErrors();

            // store that we are resetting the taskDates
            taskDateIsResetting = true;

            // reset this variable after 1.5 seconds
            setTimeout(function () {
                taskDateIsResetting = false;
            }, 1500);

            // disable minDate so we can change the stop date to something before the old minDate
            vm.datePickerOptionsStopDate.minDate = moment('1970-01-01');

            // disabling the minDate requires us to wait one digest cycle, hence we do need a defer here...
            var defer = $q.defer();

            vm.task.$get().then(
                function () {
                    vm.checkForFullDayTask();
                    defer.resolve();
                }
            );

            return defer.promise;
        };

        /**
         * reset errors
         */
        vm.resetErrors = function () {
            vm.errors = {};
        };

        /**
         * Save Task Dates (start_date and due_date) via a Patch REST request
         */
        vm.saveTaskDates = function () {
            vm.readOnly = true;
            // always initialize with primary key
            var data = {
                pk: vm.task.pk
            };

            data['start_date'] = vm.task.start_date;
            data['due_date'] = vm.task.due_date;

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            TaskRestService.updatePartial(data).$promise.then(
                function success (response) {
                    vm.task = response;

                    updateAssignedUserPks(response);
                    updateProjectPks(response);

                    vm.checkForFullDayTask();
                    // worked
                    d.resolve();
                },
                function error (rejection) {
                    /**
                     * Handle errors for saving task dates
                     */
                    if (rejection && rejection.data && rejection.data['start_date']) {
                        vm.errors = rejection.data;
                        d.reject(rejection.data['start_date'].join(", "));
                    } else if (rejection.data.non_field_errors) {
                        // non_field_error occured (e.g., object has already been trashed/soft-deleted) and can
                        // therefore no longer be edited
                        d.reject(rejection.data.non_field_errors);
                        vm.errors['start_date'] = rejection.data.non_field_errors;
                    } else if (rejection && rejection.data && rejection.data['due_date']) {
                        vm.errors = rejection.data;
                        d.reject(rejection.data['due_date'].join(", "));
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                        vm.errors['start_date'] = [rejection.data.detail];
                        vm.errors['due_date'] = [rejection.data.detail];
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Task"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                        vm.errors['start_date'] = [gettextCatalog.getString("Unknown error")];
                        vm.errors['due_date'] = [gettextCatalog.getString("Unknown error")];
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Update kanban board assignments of a task
         * @param task
         */
        var updateKanbanBoardAssignments = function (task) {
            vm.kanbanBoardAssignments.length = 0;

            TaskKanbanboardColumnRestService(task.pk).query().$promise.then(
                function success (response) {
                    Array.prototype.push.apply(vm.kanbanBoardAssignments, response);
                }
            );
        };

        /**
         * Updates the list of assigned user pks
         * This is necessary as the list of PKs needs to be a string, but the User PKs are integers
         * @param task
         */
        var updateAssignedUserPks = function (task) {
            vm.assignedUserPks.length = 0;
            // convert all assigned user PKs to strings
            if (task.assigned_users_pk) {
                for (var i = 0; i < task.assigned_users_pk.length; i++) {
                    vm.assignedUserPks.push(task.assigned_users_pk[i].toString());
                }
            }
        };

        /**
         * Updates a list of project pks
         * This is necessary as the list of PKs has a different reference,
         * and the angular $watchGroup does not allow
         * to watch for array changes
         * @param task
         */
        var updateProjectPks = function (task) {
            vm.projectPks.length = 0;
            if (task.projects) {
                for (var i = 0; i < task.projects.length; i++) {
                    vm.projectPks.push(task.projects[i]);
                }
            }
        };

        /**
         * Save a task via REST API as a full update
         */
        vm.saveTask = function () {
            vm.readOnly = true;
            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // set projects
            vm.task.projects = vm.projectPks;

            // set assigned users
            vm.task.assigned_users_pk = vm.assignedUserPks;

            // update task via rest api
            vm.task.$update().then(
                function success (response) {
                    updateAssignedUserPks(response);
                    updateProjectPks(response);

                    vm.checkForFullDayTask();
                    // worked
                    vm.task = response;
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
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Task"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Saves a task via REST API partial update
         * @param key
         * @param value
         */
        vm.saveTaskPartial = function (key, value) {
            vm.readOnly = true;
            // always initialize with primary key
            var data = {
                pk: vm.task.pk
            };

            data[key] = value;

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            TaskRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateAssignedUserPks(response);
                    updateProjectPks(response);

                    vm.checkForFullDayTask();
                    // worked
                    vm.task = response;
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
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                        vm.errors[key] = [rejection.data.detail];
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Task"));
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
