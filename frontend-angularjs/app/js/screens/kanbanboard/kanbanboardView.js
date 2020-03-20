/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Show and Edit Kanbanboard View
     */
    module.component('kanbanboardView', {
        templateUrl: 'js/screens/kanbanboard/kanbanboardView.html',
        controller: 'KanbanboardViewController',
        controllerAs: 'vm',
        bindings: {
            'kanbanboard': '<'
        }
    });

    /**
     * Kanbanboard Detail View Controller
     *
     * Displays the Kanbanboard Detail View
     */
    module.controller('KanbanboardViewController', function (
        $scope,
        $q,
        $uibModal,
        gettextCatalog,
        toaster,
        KanbanboardRestService,
        KanbanboardColumnTaskAssignmentRestService,
        KanbanboardBackgroundStyleModalService,
        PermissionService,
        IconImagesService,
        BackgroundStyleService,
        WorkbenchElementChangesWebSocket
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * Kanbanboard Icon
             * @type {string}
             */
            vm.kanbanboardIcon = IconImagesService.mainElementIcons.kanbanboard;

            /**
             * gets the correct icons
             */
            vm.editIcon = IconImagesService.mainActionIcons.edit;
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * The column thats selected by drag and drop
             * @type {null}
             */
            vm.selectedColumn = null;

            /**
             * List of column task assignments
             * @type {Array}
             */
            vm.columnTaskAssignments = [];

            /**
             * A string for filtering tasks
             * @type {string}
             */
            vm.searchField = "";

            /**
             * Filtered task list (auto generated based on filters)
             * @type {Array}
             */
            vm.filteredColumnTaskAssignments = [];

            /**
             * A list of users
             * @type {Array}
             */
            vm.users = [];

            /**
             * Whether or not a drag operation is currently in progress
             * @type {boolean}
             */
            vm.isDragging = false;

            /**
             * Whether tasks have been loaded yet
             * @type {boolean}
             */
            vm.tasksLoaded = false;

            /**
             * Whether the element is currently locked or not (determined by vm.onLock and vm.onUnlock)
             * @type {boolean}
             */
            vm.isLocked = false;

            // expand the meta data if there are no columns for this board, else collapse it
            if (vm.kanbanboard.kanban_board_columns.length > 0) {
                vm.metaDataCollapsed = true;
            } else {
                vm.metaDataCollapsed = false;
            }

            /**
             * REST Service for querying tasks of a kanban board
             */
            vm.kanbanColumnTasksRestService = KanbanboardColumnTaskAssignmentRestService(vm.kanbanboard.pk);

            /**
             * Initialize WebSocket: Subscribe to changes on the websocket
             */
            var wsUnsubscribeFunction = WorkbenchElementChangesWebSocket.subscribe(
                "kanbanboard", vm.kanbanboard.pk, function onChange (jsonMessage) {
                    if (jsonMessage['kanbanboard_column_changed']) {
                        // element has changed, update kanban_board_columns and task assignments
                        KanbanboardRestService.get({pk: vm.kanbanboard.pk}).$promise.then(
                            function success (response) {
                                vm.kanbanboard.kanban_board_columns = response.kanban_board_columns;
                            }
                        );
                    }

                    if (jsonMessage['kanbanboard_task_assignment_changed']) {
                        var assignmentId = jsonMessage['kanbanboard_task_assignment_changed'].id;

                        var found = false;

                        for (var i = 0; i < vm.columnTaskAssignments.length; i++) {
                            if (vm.columnTaskAssignments[i].pk == assignmentId) {
                                vm.columnTaskAssignments[i].$getCached();
                                found = true;
                                break;
                            }
                        }

                        if (!found) {
                            console.log("Reloading all assignments...");
                            vm.queryTasksOfKanbanBoard();
                        }
                    }

                    if (jsonMessage['kanbanboard_task_assignment_deleted']) {
                        vm.queryTasksOfKanbanBoard();
                    }
                }
            );

            $scope.$on("$destroy", function () {
                wsUnsubscribeFunction();
            });

            // handle drag-start and drag-end events within the kanban board
            $scope.$on("kanban-drag-start", vm.dragStart);
            $scope.$on("kanban-drag-end", vm.dragEnd);

            /**
             * If a column is removed from the kanban,
             * we need to take care of the remaining columns
             */
            $scope.$on("kanban-remove-column", function (event, args) {
                // remove the column from kanbanboard and reset the ordering
                var idx = -1,
                    i = 0;

                for (i = 0; i < vm.kanbanboard.kanban_board_columns.length; i++) {
                    if (vm.kanbanboard.kanban_board_columns[i].pk == args.column.pk) {
                        idx = i;
                        break;
                    }
                }

                if (idx == -1) {
                    console.error("Could not find column that should be deleted... exiting");

                    return;
                }

                vm.kanbanboard.kanban_board_columns.splice(idx, 1);

                // iterate over all columns and reset the ordering
                for (i = 0; i < vm.kanbanboard.kanban_board_columns.length; i++) {
                    vm.kanbanboard.kanban_board_columns[i].ordering = i;
                }

                // update via REST API
                vm.saveKanbanColumns().then(
                    function success (response) {
                    },
                    function error (errors) {
                        toaster.pop('error',
                            gettextCatalog.getString("Error"),
                            gettextCatalog.getString(errors.join(", "))
                        );
                    }
                );
            });

            /**
             * If the kanban task list is updated (e.g., from the inside when a task is moved),
             * we need to update it on the outside too
             */
            $scope.$on("kanban-task-list-updated", function (event, args) {
                vm.columnTaskAssignments = args.response;
            });

            /**
             * Watch filters and the tasks that are retrieved from the REST API
             * When any of these things changes, we need to update the filtered tasks (`updateFilteredTasks`) and the
             * users list (`updateUserList`)
             */
            $scope.$watchGroup(
                ["vm.columnTaskAssignments", "vm.searchField", "vm.selectedUsers"],
                function () {
                    updateFilteredTasks();
                    updateUserList();
                }
            );

            $scope.$watch("vm.kanbanboard.download_background_image", function (newVal, oldVal) {
                BackgroundStyleService.setImage(newVal);
            });

            /**
             * If the background color changes, we need to notify the background style service
             * Also, if the background color is actually changed, we need to reset the background image
             */
            $scope.$watch("vm.kanbanboard.background_color", function (newVal, oldVal) {
                BackgroundStyleService.setColor(newVal);

                if (newVal != oldVal && newVal != null) {
                    BackgroundStyleService.setImage(null);
                }
            });

            $scope.$on("$destroy", function () {
                BackgroundStyleService.clear();
            });

            updateProjectPks(vm.kanbanboard);

            $q.when().then(vm.queryTasksOfKanbanBoard);
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
         * Toggles visibility of meta data
         * Default setting (closed or open) is determined in `this.$onInit = function () {  init();  };`
         */
        vm.toggleMetaDataVisibility = function () {
            vm.metaDataCollapsed = !vm.metaDataCollapsed;
        };

        /**
         * reset errors
         */
        vm.resetErrors = function () {
            vm.errors = {};
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.kanbanboard);
        };

        /**
         * Saves a kanbanboard via REST API
         * Title and Project PK
         */
        vm.saveKanbanboard = function () {
            vm.readOnly = true;
            // always initialize with primary key, title and projects
            var data = {
                pk: vm.kanbanboard.pk,
                title: vm.kanbanboard.title,
                projects: vm.projectPks
            };

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            KanbanboardRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    vm.kanbanboard = response;
                    // worked
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
                        toaster.pop('error', gettextCatalog.getString("Failed to update Task Board"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
            });

            return d.promise;
        };

        /**
         * Saves a kanbanboard via REST API partial update
         * @param key
         * @param value
         */
        vm.saveKanbanboardPartial = function (key, value) {
            vm.readOnly = true;
            var data = {
                pk: vm.kanbanboard.pk
            };

            data[key] = value;

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            KanbanboardRestService.updatePartial(data).$promise.then(
                function success (response) {
                    updateProjectPks(response);
                    vm.kanbanboard = response;
                    // worked
                    d.resolve();
                },
                function error (rejection) {
                    // reset kanbanboard
                    vm.kanbanboard.$getCached();

                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data && rejection.data[key]) {
                        // Validation error - an error message is provided by the api
                        d.reject(rejection.data[key]);
                        vm.errors = rejection.data;
                    } else if (rejection.data.non_field_errors) {
                        // non_field_error occurred (e.g., object has already been trashed/soft-deleted) and can
                        // therefore no longer be edited
                        d.reject(rejection.data.non_field_errors);
                        vm.errors[key] = rejection.data.non_field_errors;
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                        vm.errors[key] = [rejection.data.detail];
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Task Board"));
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
         * Adds a new column at the right end of the kanban board
         * This is accomplished by determining the current max ordering and adding +1 to it
         */
        vm.addNewColumn = function () {
            // determine maxOrdering
            var maxOrdering = -1;

            for (var i = 0; i < vm.kanbanboard.kanban_board_columns.length; i++) {
                if (vm.kanbanboard.kanban_board_columns[i].ordering > maxOrdering) {
                    maxOrdering = vm.kanbanboard.kanban_board_columns[i].ordering;
                }
            }

            var column = {
                'title': gettextCatalog.getString("New column"), // default title
                'color': "rgba(224,224,224,0.65)", // default color: gray-ish
                'icon': '',
                'ordering': maxOrdering + 1
            };

            // push to kanban board columns
            vm.kanbanboard.kanban_board_columns.push(column);

            // and save via rest api
            return vm.saveKanbanColumns();
        };

        vm.promptBackgroundStyle = function () {
            var loadKanbanboard = function () {
                return vm.kanbanboard;
            };

            KanbanboardBackgroundStyleModalService.open(loadKanbanboard, vm.saveKanbanboardPartial);
        };

        /**
         * Iterates over all columns and collects the Task PKs of all tasks in those columns
         * @returns {Array} list of task pks within the kanban board
         */
        var getListOfTaskPksInKanban = function () {
            var taskPks = [];

            // iterate over columnTaskAssignments to retrieve all tasks
            for (var i = 0; i < vm.columnTaskAssignments.length; i++) {
                taskPks.push(vm.columnTaskAssignments[i].task.pk);
            }

            return taskPks;
        };

        /**
         * Decide whether the provided task assignment (i.e., task.title, task.description ...)
         * contains vm.searchField
         * @param taskAssignment
         * @returns {boolean}
         */
        var filterBySearchField = function (taskAssignment) {
            // check if filter is active
            if (!vm.searchField || vm.searchField == "") {
                // filter is not active
                return true;
            }

            var task = taskAssignment.task;

            // check if the text of searchField can be found in the task title or description
            return task.title.toLowerCase().indexOf(vm.searchField.toLowerCase()) >= 0 ||
                task.description.toLowerCase().indexOf(vm.searchField.toLowerCase()) >= 0 ||
                String("#" + task.task_id).indexOf(vm.searchField) >= 0;
        };


        /**
         * Decide whether the provided task is associated (created_by or assigned_to) vm.selectedUsers
         * @param task
         * @returns {boolean}
         */
        var filterBySelectedUser = function (taskAssignment) {
            var task = taskAssignment.task;

            // check if filter is active
            if (!vm.selectedUsers || vm.selectedUsers.length == 0) {
                return true;
            }

            if (vm.selectedUsers == task.created_by.pk) {
                return true;
            }

            // iterate over assigned users
            for (var i = 0; i < task.assigned_users.length; i++) {
                if (task.assigned_users[i].pk == vm.selectedUsers) {
                    return true;
                }
            }

            return false;
        };


        /**
         * Updates filtered tasks by search string and assigned user
         * This is triggered by a `$scope.$watchGroup` (see below) on
         * - vm.columnTaskAssignments
         * - vm.searchField
         * - vm.selectedUsers
         */
        var updateFilteredTasks = function () {
            vm.filteredColumnTaskAssignments.length = 0;

            for (var i = 0; i < vm.columnTaskAssignments.length; i++) {
                var taskAssignment = vm.columnTaskAssignments[i];

                var showInFilteredTasks = filterBySearchField(taskAssignment) &&
                    filterBySelectedUser(taskAssignment);

                if (showInFilteredTasks) {
                    vm.filteredColumnTaskAssignments.push(taskAssignment);
                }
            }
        };


        /**
         * When vm.columnTaskAssignments is updated, we can also updated our (offline) users list
         *
         * vm.users is then used in the user selectize widget to display the users that are assigned to the tasks
         */
        var updateUserList = function () {
            vm.users.length = 0;

            for (var i = 0; i < vm.columnTaskAssignments.length; i++) {
                var taskAssignment = vm.columnTaskAssignments[i];

                // add the user that created this task
                vm.users.push(taskAssignment.task.created_by);
                vm.users.push(taskAssignment.task.last_modified_by);

                // add all assigned users
                for (var j = 0; j < taskAssignment.task.assigned_users.length; j++) {
                    vm.users.push(taskAssignment.task.assigned_users[j]);
                }
            }
        };

        /**
         * Opens the Backlog in a modal dialog
         * In the backlog, users can select tasks that they want to add to the kanban board
         * On success, those tasks are added to the first column (which usually should be new)
         */
        vm.openBacklog = function (column) {
            if (!column || typeof column === "undefined") {
                column = vm.kanbanboard.kanban_board_columns[0];
            }

            // open modal dialog
            var modalInstance = $uibModal.open({
                'controller': "KanbanboardViewBacklogModalController",
                'templateUrl': "js/screens/kanbanboard/kanbanboardViewBacklogModal.html",
                'controllerAs': 'vm',
                'bindToController': true,
                'size': 'lg',
                'backdrop': 'static',
                'resolve': {
                    'alreadyAddedTaskPks': function () {
                        // provide the modal dialog with a list of task pks that are already in the board
                        return getListOfTaskPksInKanban();
                    }
                }
            });

            // when the modal is closed
            modalInstance.result.then(
                // add the selected tasks to the board
                function tasksSelected (selectedTasks) {
                    /**
                     * Collect the tasks and the respective task assignments that need to be created
                     * @type {Array}
                     */
                    var entries = [];

                    // iterate over each selected task and create a new assignment entry
                    for (var i = 0; i < selectedTasks.length; i++) {
                        var entry = {
                            'task_id': selectedTasks[i],
                            'kanban_board_column': column.pk
                        };

                        entries.push(entry);
                    }

                    // Call "createMany" REST endpoint of the kanban board column tasks rest service, which takes an
                    // array of entries; this is much faster than adding each task one by one
                    vm.kanbanColumnTasksRestService.resource.createMany(entries).$promise.then(
                        function success (response) {
                            // on success, set the response as the new columnTaskAssignments
                            vm.columnTaskAssignments = response;
                        },
                        function error (rejection) {
                            console.log(rejection);

                            if (rejection.status == 403) {
                                // permission denied, this is handled by our middleware with a toaster popup
                            } else {
                                // another error
                                if (rejection.data.length !== 0) {
                                    toaster.pop('error', rejection.data[0])
                                } else {
                                    toaster.pop('error', gettextCatalog.getString("Unknown error"));
                                }
                            }
                        }
                    );
                },
                function dismissed () {
                    // dismiss - no tasks need to be added
                    console.log("Task List Modal was dismissed");
                }
            );
        };

        /**
         * Saves the kanban columns via REST API
         */
        vm.saveKanbanColumns = function () {
            return vm.saveKanbanboardPartial("kanban_board_columns", vm.kanbanboard.kanban_board_columns);
        };

        /**
         * When a column is moved via drag and drop, we need to update the ordering and save the change via REST API
         * @param column
         * @param index
         */
        vm.dndMoveColumn = function (column, index) {
            vm.kanbanboard.kanban_board_columns.splice(index, 1);

            // iterate over all columns and reset the ordering
            for (var i = 0; i < vm.kanbanboard.kanban_board_columns.length; i++) {
                vm.kanbanboard.kanban_board_columns[i].ordering = i + 1;
            }

            // update via REST API
            return vm.saveKanbanColumns();
        };

        /**
         * Queries the tasks of the kanban board
         * This API calls retrieves all tasks that are assigned to the kanban board via its columns
         */
        vm.queryTasksOfKanbanBoard = function () {
            return vm.kanbanColumnTasksRestService.queryCached().$promise.then(
                function success (response) {
                    // make sure to create a copy of the original object, so that we cause the $watchGroup to fire
                    vm.columnTaskAssignments = angular.copy(response);

                    vm.tasksLoaded = true;
                }
            )
        };

        /**
         * Updates a list of project pks
         * This is necessary as the list of PKs has a different reference,
         * and the angular $watchGroup does not allow
         * to watch for array changes
         * @param kanbanboard
         */
        var updateProjectPks = function (kanbanboard) {
            vm.projectPks.length = 0;
            if (kanbanboard.projects) {
                for (var i = 0; i < kanbanboard.projects.length; i++) {
                    vm.projectPks.push(kanbanboard.projects[i]);
                }
            }
        };

        /**
         * save the searchString for filtering
         * @param searchString
         */
        vm.doSearch = function (searchString) {
            vm.searchField = searchString;
        };

        /**
         * Cancel the current search
         */
        vm.cancelSearch = function () {
            vm.searchField = "";
            console.log("cancel search");
        };


        /**
         * Drag Start event
         * set isDragging to true, showing the "Trashcan" for dragged elements
         */
        vm.dragStart = function () {
            vm.isDragging = true;
        };

        /**
         * Drag End event
         * set isDragging to false, hiding the "Trashcan"
         */
        vm.dragEnd = function () {
            vm.isDragging = false;
        };

        /**
         * TrashCan: Allow removing tasks from the Kanban
         * @param index
         * @param item
         * @param external
         * @param type
         */
        vm.onDropDeleteObject = function (index, item, external, type) {
            vm.isDragging = false;

            if (type == 'task') {
                vm.removeTaskAssignmentFromKanbanBoard(item);
            } else {
                console.error("Unsupported type " + type);
            }
        };

        /**
         * Removes a task from the kanban board
         * @param taskAssignment
         */
        vm.removeTaskAssignmentFromKanbanBoard = function (taskAssignment) {
            var idx = 0,
                i = 0;

            /**
             * Step 1: Check if the task is in vm.filteredColumnTaskAssignments (it should be)
             */
            for (i = 0; i < vm.filteredColumnTaskAssignments.length; i++) {
                if (vm.filteredColumnTaskAssignments[i].pk == taskAssignment.pk) {
                    idx = i;
                    break;
                }
            }

            // task found?
            if (idx == -1) {
                console.error("Tried to delete a taskAssignment that is not in filteredColumnTaskAssignments");

                return;
            }

            // remove it from the filteredColumnTaskAssignments array - this should also remove it from the view
            vm.filteredColumnTaskAssignments.splice(idx, 1);

            /**
             * Step 2: Check if the task is in vm.columnTaskAssignments (it should be)
             */
            for (i = 0; i < vm.columnTaskAssignments.length; i++) {
                if (vm.columnTaskAssignments[i].pk == taskAssignment.pk) {
                    idx = i;
                    break;
                }
            }

            // task found?
            if (idx == -1) {
                console.error("Tried to delete a taskAssignment that is not in columnTaskAssignments");

                return;
            }

            // delete it via REST API, and then update the columnTaskAssignments array by querying the REST API
            vm.columnTaskAssignments[idx].$delete().then(
                function success (response) {

                    // query tasks again
                    vm.queryTasksOfKanbanBoard();
                },
                function error (rejection) {
                    console.log(rejection);

                    // we have removed the task from filtered column tasks already, need to revert that
                    updateFilteredTasks();

                    if (rejection.status == 403) {
                        // permission denied, handled by our middleware
                    } else {
                        toaster.pop("error", gettextCatalog.getString("Failed to delete task assignment"));
                    }
                }
            );
        };
    });
})();
