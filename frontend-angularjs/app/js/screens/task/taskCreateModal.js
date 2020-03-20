/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Service for creating a task-create modal dialog
     */
    module.service('taskCreateModalService', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @returns {$uibModalInstance}
         */
        service.open = function (template) {
            return $uibModal.open({
                templateUrl: 'js/screens/task/taskCreateModal.html',
                controller: 'TaskCreateModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    template: function () {
                        return template;
                    }
                }
            });
        };

        /**
         * View the supplied element
         * @param task
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (task, options) {
            return $state.go("task-view", {task: task}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param task
         * @returns {string} the url
         */
        service.getViewUrl = function (task) {
            return $state.href("task-view", {task: task});
        };

        return service;
    });

    /**
     * Task Create Controller
     *
     * Displays the Task Create Form
     */
    module.controller('TaskCreateModalController', function (
        $scope,
        $state,
        $timeout,
        $uibModalInstance,
        CalendarConfigurationService,
        TaskRestService,
        TaskConverterService,
        toaster,
        gettextCatalog,
        ProjectSidebarService,
        IconImagesService,
        PermissionService,
        template
    ) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            /**
             * DatePicker Options
             * @type {
             * {format: string,
             *  widgetPositioning: {horizontal: string, vertical: string},
             *  allowInputToggle: boolean, showTodayButton: boolean}
             * }
             */
            var datePickerOptions = CalendarConfigurationService.getOptions({
                widgetPositioning: {horizontal: 'right', vertical: 'bottom'},
                allowInputToggle: true,
                showTodayButton: true
            });

            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * Task Type Service
             */
            vm.taskConverterService = TaskConverterService;

            /**
             * gets the correct alert icon
             */
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            // copy date picker options for start date and stop date
            vm.datePickerOptionsStartDate = angular.copy(datePickerOptions);
            vm.datePickerOptionsStopDate = angular.copy(datePickerOptions);

            /**
             * Whether the task is a full day task or not (automatically determined, toggled)
             * @type {boolean}
             */
            vm.isFullDay = false;

            /**
             * A list of assigned user PKs
             * @type {Array}
             */
            vm.assignedUserPks = [];

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * when template is not null the data of the template object should
             * be shown in the modal view else the default data
             */
            if (template) {
                vm.task = template;
                if (template.title) {
                    vm.task.title = gettextCatalog.getString('Copy of ') + vm.task.title;
                }
                if (template.assigned_users_pk) {
                    vm.assignedUserPks = template.assigned_users_pk;
                }
                if (template.projects) {
                    vm.projectPks = template.projects;
                }
                if (!template.checklist_items) {
                    vm.task.checklist_items = [];
                }
                if (!template.start_date) {
                    vm.task.start_date = null;
                }
                if (!template.due_date) {
                    vm.task.due_date = null;
                }
                if (!template.labels) {
                    vm.task.labels = [];
                }
            } else {
                vm.task = {
                    state: TaskConverterService.taskStateOrder[0],
                    priority: 'NORM',
                    start_date: null,
                    due_date: null,
                    checklist_items: [],
                    labels: []
                };

                /**
                 * Add current project
                 */
                if (ProjectSidebarService.project) {
                    vm.projectPks.push(ProjectSidebarService.project.pk);
                }
            }
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return !PermissionService.has('object.edit', vm.task);
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
         * On any change of start_date, adapt stop_date
         * This is accomplished by calculating the time difference in minutes from the original start_date and the new
         * start_date, and adding exactly that value to stop_date
         */
        $scope.$watch('vm.task.start_date', function (newVal, oldVal) {
            // due_date needs to have a min_date of the current date
            vm.datePickerOptionsStopDate.minDate = vm.task.start_date;

            // calculate the difference in minutes between the old value and new value of start_date
            var diffMinutes = moment(newVal).diff(moment(oldVal), 'minutes');

            // apply this difference to the due_date
            $timeout(function () {
                vm.task.due_date = moment(vm.task.due_date).add(diffMinutes, 'minutes');

                // if this is a full day task, make sure to "round" due_date to the end of the day
                if (vm.isFullDay) {
                    vm.task.due_date = moment(vm.task.due_date).endOf("day");
                }
            });
        });

        /**
         * On create
         * Calls REST API to create a new task and redirects to task/view on success
         */
        vm.create = function () {
            // assign task assignees to the task object
            vm.task.assigned_users_pk = vm.assignedUserPks;
            // assign projects
            vm.task.projects = vm.projectPks;

            vm.errors = {};

            // call REST API
            TaskRestService.create(vm.task).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Task created"));

                    // done - close the modal dialog
                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to create task"));
                    console.log(rejection);
                    vm.errors = rejection.data;

                    // handle permission denied errors
                    if (rejection.status == 403) {
                        // permission denied -> this is most likely due to the fact that the user does not have the
                        // appropriate permissions in the selected project
                        if (vm.task.projects && vm.task.projects.length > 0) {
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new task in at least one of the " +
                                    "specified projects"
                                )
                            ];
                        } else {
                            // permission denied -> user must select a project
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new task without selecting a project"
                                )
                            ];
                        }
                    }
                }
            )
        };

        /**
         * Dismiss the modal dialog
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
