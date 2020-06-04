/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('screens');

    /**
     * Component for the user settings
     */
    module.component('userSettings', {
        templateUrl: 'js/screens/userSettings/userSettings.html',
        controller: 'UserSettingsController',
        controllerAs: 'vm'
    });

    /**
     * Controller for the UserSettings component
     */
    module.controller('UserSettingsController', function (
        gettextCatalog,
        toaster,
        NotificationConfigurationRestService,
        confirmDialogService
    ) {
        var vm = this;

        this.$onInit = function () {
            vm.promptMap = confirmDialogService.getDialogInfos();
            vm.allPromptsEnabled = false;

            /**
             * enabled notifications received from API
             */
            vm.enabledNotificationsObject = [];

            /**
             * for Appointments: includes all elements for display
             */
            vm.notificationConfigurationMeetings = {
                'NOTIFICATION_CONF_MEETING_USER_CHANGED': {
                    'label': gettextCatalog.getString("Notify me when I was added or removed as an attending user of " +
                        "an appointment."),
                    'enabled': false
                },
                'NOTIFICATION_CONF_MEETING_CHANGED': {
                    'label': gettextCatalog.getString("Notify me when one of my appointments was changed."),
                    'enabled': false
                },
                'NOTIFICATION_CONF_MEETING_RELATION_CHANGED': {
                    'label': gettextCatalog.getString("Notify me when a link/comment was added to one of my appointments."),
                    'enabled': false
                },
                'NOTIFICATION_CONF_MEETING_REMINDER': {
                    'label': gettextCatalog.getString("Remind me of upcoming meetings I attend."),
                    'enabled': false
                }
            };

            /**
             * for Tasks: includes all elements for display
             */
            vm.notificationConfigurationTasks = {
                'NOTIFICATION_CONF_TASK_USER_CHANGED': {
                    'label': gettextCatalog.getString("Notify me when I was added or removed as a task assignee."),
                    'enabled': false
                },
                'NOTIFICATION_CONF_TASK_CHANGED': {
                    'label': gettextCatalog.getString("Notify me when one of my tasks was changed."),
                    'enabled': false
                },
                'NOTIFICATION_CONF_TASK_RELATION_CHANGED': {
                    'label': gettextCatalog.getString("Notify me when a link/comment was added to one of my tasks."),
                    'enabled': false
                }
            };

            /**
             * for Projects: includes all elements for display
             */
            vm.notificationConfigurationProjects = {
                'NOTIFICATION_CONF_PROJECT_USER_CHANGED': {
                    'label': gettextCatalog.getString("Notify me when I was added or removed from a project " +
                        "or when my role was changed."),
                    'enabled': false
                },
                'NOTIFICATION_CONF_PROJECT_CHANGED': {
                    'label': gettextCatalog.getString("Notify me when one of my projects was changed."),
                    'enabled': false
                }
            };

            /**
             * Whether or not all appointment notifications are selected
             * @type {boolean}
             */
            vm.allMeetingsSelected = false;

            /**
             * Whether or not all task notifications are selected
             * @type {boolean}
             */
            vm.allTasksSelected = false;

            /**
             * Whether or not all project notifications are selected
             * @type {boolean}
             */
            vm.allProjectsSelected = false;

            loadNotificationConfiguration();
            vm.checkAllPromptsEnabled();
        };

        vm.checkAllPromptsEnabled = function () {
            var allEnabled = true;

            for (var property in vm.promptMap) {
                if (vm.promptMap.hasOwnProperty(property)) {
                    var dialog = vm.promptMap[property];

                    if (!dialog.enabled) {
                        allEnabled = false;
                        break;
                    }
                }
            }

            vm.allPromptsEnabled = allEnabled;
        };

        vm.togglePromptEnabled = function (key) {
            var oldValue = vm.promptMap[key].enabled,
                newValue = !oldValue;

            vm.setPromptEnabled(key, newValue);
        };

        vm.setPromptEnabled = function (key, value) {
            confirmDialogService.setDialogActive(key, value);
            vm.checkAllPromptsEnabled();
            vm.saveDialogSettings();
        };

        vm.toggleAllPrompts = function () {
            vm.allPromptsEnabled = !vm.allPromptsEnabled;

            var keys = confirmDialogService.getDialogKeys();

            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];

                confirmDialogService.setDialogActive(key, vm.allPromptsEnabled);
                vm.promptMap[key].enabled = vm.allPromptsEnabled;
            }
            vm.saveDialogSettings();
        };

        vm.saveDialogSettings = function () {
            confirmDialogService.save().then(
                function success () {
                    vm.promptMap = confirmDialogService.getDialogInfos();
                    vm.checkAllPromptsEnabled();
                },
                function error () {
                    // error is displayed by confirmDialogService already
                }
            );
        };

        /**
         * check if notifications for a specific element are enabled or not
         */
        var setConfigurationNotificationFlag = function () {
            var meeting_keys = Object.keys(vm.notificationConfigurationMeetings);

            // Appointments
            vm.allMeetingsSelected = true;
            for (var i = 0; i < meeting_keys.length; i++) {
                if (vm.enabledNotificationsObject.allowed_notifications.indexOf(meeting_keys[i]) >= 0) {
                    vm.notificationConfigurationMeetings[meeting_keys[i]].enabled = true;
                } else {
                    vm.notificationConfigurationMeetings[meeting_keys[i]].enabled = false;
                    // at least one appointment notification is unselected - change allMeetingsSelected to false
                    vm.allMeetingsSelected = false;
                }
            }

            //Tasks
            var task_keys = Object.keys(vm.notificationConfigurationTasks);

            vm.allTasksSelected = true;
            for (var j = 0; j < task_keys.length; j++) {
                if (vm.enabledNotificationsObject.allowed_notifications.indexOf(task_keys[j]) >= 0) {
                    vm.notificationConfigurationTasks[task_keys[j]].enabled = true;
                } else {
                    vm.notificationConfigurationTasks[task_keys[j]].enabled = false;
                    // at least one task notification is unselected - change allTasksSelected to false
                    vm.allTasksSelected = false;
                }
            }

            //Projects
            var project_keys = Object.keys(vm.notificationConfigurationProjects);

            vm.allProjectsSelected = true;
            for (var k = 0; k < project_keys.length; k++) {
                if (vm.enabledNotificationsObject.allowed_notifications.indexOf(project_keys[k]) >= 0) {
                    vm.notificationConfigurationProjects[project_keys[k]].enabled = true;
                } else {
                    vm.notificationConfigurationProjects[project_keys[k]].enabled = false;
                    // at least one project notification is unselected - change alProjectsSelected to false
                    vm.allProjectsSelected = false;
                }
            }
        };

        /**
         * returns a list of all enabled notifications
         * @returns {Array}
         */
        var getAllEnabledConfigurations = function () {
            //Appointments
            var meeting_keys = Object.keys(vm.notificationConfigurationMeetings),
                enabledNotifications = [],
                i = 0;

            for (i = 0; i < meeting_keys.length; i++) {
                if (vm.notificationConfigurationMeetings[meeting_keys[i]].enabled) {
                    enabledNotifications.push(meeting_keys[i]);
                }
            }

            //Tasks
            var task_keys = Object.keys(vm.notificationConfigurationTasks);

            for (i = 0; i < task_keys.length; i++) {
                if (vm.notificationConfigurationTasks[task_keys[i]].enabled) {
                    enabledNotifications.push(task_keys[i]);
                }
            }

            //Projects
            var project_keys = Object.keys(vm.notificationConfigurationProjects);

            for (i = 0; i < project_keys.length; i++) {
                if (vm.notificationConfigurationProjects[project_keys[i]].enabled) {
                    enabledNotifications.push(project_keys[i]);
                }
            }

            return enabledNotifications;
        };

        /**
         * load the notification configuration from api
         */
        var loadNotificationConfiguration = function () {
            NotificationConfigurationRestService.get().$promise.then(
                function success (response) {
                    vm.enabledNotificationsObject = response;
                    setConfigurationNotificationFlag();
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Notification configuration can not be loaded"));
                    vm.errors = rejection.data;
                }
            );
        };

        /**
         * get all allowed_notifications and update to api
         * if an error occurs - reload old data
         */
        var updateNotificationConfiguration = function () {

            vm.enabledNotificationsObject.allowed_notifications = getAllEnabledConfigurations();

            // send updated data to api
            NotificationConfigurationRestService.update(vm.enabledNotificationsObject).$promise.then(
                function success (response) {
                    vm.enabledNotificationsObject = response;
                    setConfigurationNotificationFlag();
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Notification configuration can not be updated"));
                    //load data again
                    loadNotificationConfiguration();

                    vm.errors = rejection.data;
                }
            );
        };


        /**
         * triggered when user toggles the 'select/unselect all appointments' checkbox
         * selects or unselects all appointment notifications
         */
        vm.toggleAllMeetings = function () {
            vm.allMeetingsSelected = !vm.allMeetingsSelected;
            var meeting_keys = Object.keys(vm.notificationConfigurationMeetings);

            for (var i = 0; i < meeting_keys.length; i++) {
                vm.notificationConfigurationMeetings[meeting_keys[i]].enabled = vm.allMeetingsSelected;
            }

            // update data
            updateNotificationConfiguration();
        };

        /**
         * triggered when a appointment notification was selected/unselected
         * change vm.allMeetingsSelected to false when at least one notification is unselected
         * change vm.allMeetingsSelected to true when all notifications are selected
         * @param notification
         */
        vm.toggleMeetingNotification = function (notification) {
            notification.enabled = !notification.enabled;

            var newValue = notification.enabled;

            // notification was selected - set allMeetingsSelected to true
            // allMeetingsSelected will be set to false when not all notifications are selected
            if (newValue) {
                vm.allMeetingsSelected = true;
            } else {
                // notification was unselected - set allMeetingsSelected to false
                vm.allMeetingsSelected = false;
            }

            var meeting_keys = Object.keys(vm.notificationConfigurationMeetings);

            for (var i = 0; i < meeting_keys.length; i++) {
                if (newValue && vm.notificationConfigurationMeetings[meeting_keys[i]].enabled !== true) {
                    // current notification was selected but at least one notification is unselected
                    // - change allMeetingsSelected to false
                    vm.allMeetingsSelected = false;
                }
            }

            // update data
            updateNotificationConfiguration();
        };

        /**
         * triggered when user toggles the 'select/unselect all tasks' checkbox
         * selects or unselects all task notifications
         */
        vm.toggleAllTasks = function () {
            vm.allTasksSelected = !vm.allTasksSelected;
            var task_keys = Object.keys(vm.notificationConfigurationTasks);

            for (var i = 0; i < task_keys.length; i++) {
                vm.notificationConfigurationTasks[task_keys[i]].enabled = vm.allTasksSelected;
            }

            // update data
            updateNotificationConfiguration();
        };

        /**
         * triggered when a task notification was selected/unselected
         * change vm.allTasksSelected to false when at least one notification is unselected
         * change vm.allTasksSelected to true when all notifications are selected
         * @param notification
         */
        vm.toggleTaskNotification = function (notification) {
            notification.enabled = !notification.enabled;

            var newValue = notification.enabled;

            // notification was selected - set allTasksSelected to true
            // allTasksSelected will be set to false when not all notifications are selected
            if (newValue) {
                vm.allTasksSelected = true;
            } else {
                // notification was unselected - set allTasksSelected to false
                vm.allTasksSelected = false;
            }

            var task_keys = Object.keys(vm.notificationConfigurationTasks);

            for (var i = 0; i < task_keys.length; i++) {
                if (newValue && vm.notificationConfigurationTasks[task_keys[i]].enabled !== true) {
                    // current notification was selected but at least one notification is unselected
                    // - change allTasksSelected to false
                    vm.allTasksSelected = false;
                }
            }

            // update data
            updateNotificationConfiguration();
        };

        /**
         * triggered when user toggles the 'select/unselect all projects' checkbox
         * selects or unselects all project notifications
         */
        vm.toggleAllProjects = function () {
            vm.allProjectsSelected = !vm.allProjectsSelected;
            var project_keys = Object.keys(vm.notificationConfigurationProjects);

            for (var i = 0; i < project_keys.length; i++) {
                vm.notificationConfigurationProjects[project_keys[i]].enabled = vm.allProjectsSelected;
            }

            // update data
            updateNotificationConfiguration();
        };

        /**
         * triggered when a project notification was selected/unselected
         * change vm.allProjectsSelected to false when at least one notification is unselected
         * change vm.allProjectsSelected to true when all notifications are selected
         * @param notification
         */
        vm.toggleProjectNotification = function (notification) {
            notification.enabled = !notification.enabled;

            var newValue = notification.enabled;

            // notification was selected - set allProjectsSelected to true
            // allProjectsSelected will be set to false when not all notifications are selected
            if (newValue) {
                vm.allProjectsSelected = true;
            } else {
                // notification was unselected - set allProjectsSelected to false
                vm.allProjectsSelected = false;
            }

            var project_keys = Object.keys(vm.notificationConfigurationProjects);

            for (var i = 0; i < project_keys.length; i++) {
                if (newValue && vm.notificationConfigurationProjects[project_keys[i]].enabled !== true) {
                    // current notification was selected but at least one notification is unselected
                    // - change allProjectsSelected to false
                    vm.allProjectsSelected = false;
                }
            }

            // update data
            updateNotificationConfiguration();
        };
    });
})();
