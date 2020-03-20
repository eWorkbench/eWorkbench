/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name kanbanboardColumn
     *
     * @restrict E
     *
     * @description
     * Directive for a Task Board Column
     * Renders a Task Board Column with multiple tasks
     *
     * @param {object} column the column that should be displayed
     * @param {object} kanbanboard the kanbanboard that the column is part of
     * @param {function} saveColumnData callback function for saving column data
     * @param {array} columnTaskAssignments a list of task assignments for the kanban board column
     * @param {function} openBacklog callback function for opening the backlog modal dialog
     */
    module.directive('kanbanboardColumn', function () {
        return {
            'restrict': 'E',
            'scope': {
                "column": '=',
                "kanbanboard": '=',
                "saveColumnData": '=',
                "columnTaskAssignments": '=',
                "openBacklog": '=',
                "removeTaskFromKanban": '='
            },
            'templateUrl': "js/widgets/kanbanboardColumn/kanbanboardColumn.html",
            'controller': "KanbanboardColumnController",
            'bindToController': true,
            'controllerAs': 'vm',
            'link': function (scope, element, attrs) {
                scope.element = element;
            }
        };
    });

    /**
     * Controller for Task Board Column
     */
    module.controller('KanbanboardColumnController', function (
        $scope,
        $uibModal,
        $window,
        $timeout,
        IconImagesService,
        KanbanboardColumnTaskAssignmentRestService,
        TaskConverterService,
        taskCreateModalService,
        confirmDialogWidget,
        scrollingService,
        toaster,
        gettextCatalog,
        ProjectPkToDetailService
    ) {
        var vm = this,
            scrollElement = null;

        this.$onInit = function () {
            vm.taskStateImages = TaskConverterService.taskStateImages;
            vm.taskIcon = IconImagesService.mainElementIcons.task;
            vm.kanbanColumnTasksRestService = KanbanboardColumnTaskAssignmentRestService(vm.kanbanboard.pk);

            $timeout(function () {
                scrollElement = $scope.element.find('.kanban-column-body');
            });
        };

        /**
         * On DragOver, initiate scrolling to bottom or to top
         * @param e
         * @returns {boolean}
         */
        vm.dragOver = function (e) {
            var elem = $scope.element[0];
            var mouseOffsetFromElementTop = e.clientY - elem.offsetTop;

            // if clientY is within the first 150 pixels of the window (at the top)
            if (mouseOffsetFromElementTop < 150) {
                if (mouseOffsetFromElementTop < 60) {
                    // scroll up very quickly
                    scrollingService.startScrolling(-20, scrollElement);
                } else if (mouseOffsetFromElementTop < 100) {
                    // scroll up at normal speed
                    scrollingService.startScrolling(-10, scrollElement);
                } else {
                    // scroll up slowly
                    scrollingService.startScrolling(-5, scrollElement);
                }

                // done
                return true;
            }

            var yFromBottom = jQuery(window).height() - e.clientY;

            // if clientY is within the last 150 pixels of the window (at the bottom)
            if (yFromBottom < 150) {
                // scroll down

                if (yFromBottom < 60) {
                    // scroll down very quickly
                    scrollingService.startScrolling(20, scrollElement);
                } else if (yFromBottom < 100) {
                    // scroll down at normal speed
                    scrollingService.startScrolling(10, scrollElement);
                } else {
                    // scroll down slowly
                    scrollingService.startScrolling(5, scrollElement);
                }

                // done
                return true;
            }

            // if we got to here, we need to cancel scrolling
            scrollingService.stopScrolling();

            return true;
        };

        /**
         * Open a modal dialog for changing a columns details
         * - Column Name
         * - Column Color
         * - Column Icon
         */
        vm.changeColumn = function () {
            // store original column data (in case we need to revert)
            var originalColumnData = angular.copy(vm.column);

            // open modal dialog
            var modalInstance = $uibModal.open({
                'controller': 'KanbanboardColumnChangeModalController',
                'templateUrl': 'js/widgets/kanbanboardColumn/kanbanboardColumnChangeModal.html',
                'controllerAs': 'vm',
                'bindToController': true,
                'resolve': {
                    'column': function () {
                        return vm.column;
                    },
                    'kanbanboard': function () {
                        return vm.kanbanboard;
                    }
                },
                'backdrop': 'static'
            });

            // on close
            modalInstance.result.then(
                function closed () {

                },
                function dismissed () {
                    console.log("Modal dialog dismissed");
                    // revert column data
                    vm.column.title = originalColumnData.title;
                    vm.column.color = originalColumnData.color;
                    vm.column.task_state = originalColumnData.task_state;
                }
            );
        };


        /**
         * Drop a task on a target column
         * @param event
         * @param index
         * @param item
         * @param external
         * @param type
         * @param column
         */
        vm.dndTaskDrop = function (event, index, item, external, type, column) {
            if (index == -1) {
                console.error("dndTaskDrop: Index is set to -1, this should not happen...");

                return;
            }

            var oldColumn = null,
                oldOrdering = null,
                selectedAssignment = null;

            // emit a drag-end so we can reset the "trashcan dropzone" in the kanban view
            vm.dragEnd();

            // update the column locally
            for (var i = 0; i < vm.columnTaskAssignments.length; i++) {
                if (vm.columnTaskAssignments[i].pk == item.pk) {
                    oldColumn = vm.columnTaskAssignments[i].kanban_board_column;
                    oldOrdering = vm.columnTaskAssignments[i].ordering;
                    selectedAssignment = vm.columnTaskAssignments[i];

                    vm.columnTaskAssignments[i].kanban_board_column = vm.column.pk;

                    // temporarily subtract a small amount, such that the ordering is updated accordingly in
                    // the frontend
                    vm.columnTaskAssignments[i].ordering = index - 0.1;
                    break;
                }
            }

            // issue a rest API call for moving the column
            vm.kanbanColumnTasksRestService.resource.moveAssignment({
                'assignment_pk': item.pk,
                'to_column': column.pk,
                'to_index': index
            }).$promise.then(
                function success (response) {
                    // success - response contains the full updated task list,
                    // which we emit to the parent directives
                    $scope.$emit("kanban-task-list-updated", {response: response});
                }, function error (rejection) {
                    // failed
                    console.log(rejection);

                    // reset selected assignment
                    selectedAssignment.kanban_board_column = oldColumn;
                    selectedAssignment.ordering = oldOrdering;

                    if (rejection.status == 403) {
                        // permission denied, no need to do anything (toaster is automatically shown by middleware)
                    } else {
                        // another error
                        toaster.pop("error", gettextCatalog.getString("Failed to update Task Board"));
                    }
                }
            );
        };

        /**
         * On drag Start emit a kanban-drag-start event and
         * stop scrolling (just in case the user was scrolling before)
         */
        vm.dragStart = function () {
            $scope.$emit("kanban-drag-start");
            scrollingService.stopScrolling();
        };

        /**
         * On drag End emit a kanban-drag-end event and stop scrolling
         */
        vm.dragEnd = function () {
            $scope.$emit("kanban-drag-end");
            scrollingService.stopScrolling();
        };

        /**
         * Open a modal dialog that asks the user whether the column should be deleted
         * also informs the user that all tasks of the column will disappear from the kanban board, and appear
         * in the backlog again
         */
        vm.deleteColumn = function () {
            // create modal dialog
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Delete column?'),
                message: gettextCatalog.getString(
                    'Do you really want to delete this column from your Task Board? ' +
                    'All tasks within this column will appear in the backlog again.'
                ),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Delete'),
                dialogKey: 'DeleteColumn'
            });

            // react on the result of the modal dialog
            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        $scope.$emit("kanban-remove-column", {column: vm.column});
                    }
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }
            );
        };

        /**
         * Opens the modal dialog for creating a new task
         * Once this is done, the task is added to the current column
         */
        vm.addNewTask = function () {
            var projectPks = vm.kanbanboard.projects;

            // load details of taskboard projects to check accessibility
            ProjectPkToDetailService.getProjectList(projectPks).then(
                function success (projects) {
                    vm.buildTaskTemplateThenOpenDialog(projects);
                },
                function error (rejection) {
                    // we should never get here, as ProjectPkToDetailService.getProjectList handles errors
                    console.log(rejection);
                    vm.buildTaskTemplateThenOpenDialog([]);
                }
            );
        };

        vm.buildTaskTemplateThenOpenDialog = function (projects) {
            // use viewable projects of kanbanboard as default for the new task
            var defaultProjects = [],
                project = null,
                i = -1,
                canCreateTask = false;

            if (projects && projects.length > 0) {
                for (i = 0; i < projects.length; i++) {
                    project = projects[i];

                    // use project as default, if it is accessible and the user can create a task there
                    if (project && 'current_users_project_permissions_list' in project) {
                        // project is accessible -> check for add_task permission
                        canCreateTask = project.current_users_project_permissions_list
                            .indexOf("shared_elements.add_task") >= 0;

                        if (canCreateTask) {
                            defaultProjects.push(project.pk);
                        }
                    }
                }
            }

            // pre fill the task template with the current columns task state
            var template = {
                'state': vm.column.task_state,
                'projects': defaultProjects
            };

            vm.openNewTaskDialog(template);
        };

        vm.openNewTaskDialog = function (template) {
            // open modal dialog for creating a new task
            taskCreateModalService.open(template).result.then(
                function success (task) {
                    // task created -> create a new entry to add task to the current column
                    var entry = {
                        'task_id': task.pk,
                        'kanban_board_column': vm.column.pk
                    };

                    // call REST API to create a new entry for the newly created task
                    vm.kanbanColumnTasksRestService.create(entry).$promise.then(
                        function success (response) {
                            // Done - copy the existing column task assignment list
                            var newList = angular.copy(vm.columnTaskAssignments);

                            // and push the response (the newly created assignment) into the list
                            newList.push(response);

                            // and emit the updated kanban task list so the kanban view can update accordingly
                            $scope.$emit("kanban-task-list-updated", {response: newList});
                        },
                        function error (rejection) {
                            // failed
                            toaster.pop(
                                'error',
                                gettextCatalog.getString("Error"),
                                gettextCatalog.getString("Could not add task to Task Board Column")
                            );
                            console.log(rejection);
                        }
                    );
                }
            );
        }
    });
})();
