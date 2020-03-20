/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.controller('KanbanboardViewBacklogModalController', function (
        $scope,
        $q,
        $uibModalInstance,
        AuthRestService,
        IconImagesService,
        TaskConverterService,
        TaskRestService,
        gettextCatalog,
        toaster,
        alreadyAddedTaskPks,
        PaginationCountHeader
    ) {
        'ngInject';

        var vm = this,
            /**
             * Config: Number of tasks displayed per page
             * @type {number}
             * */
            tasksPerPage = 10;

        this.$onInit = function () {
            /**
             * A list of tasks (fetched from REST API)
             * @type {Array}
             */
            vm.tasks = [];

            /**
             * A list of task pks that have already been added to the kanban
             * @type {alreadyAddedTaskPks|*}
             */
            vm.alreadyAddedTaskPks = alreadyAddedTaskPks;

            /**
             * Filtered task list (auto generated based on filters)
             * @type {Array}
             */
            vm.filteredTasks = [];

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * The task type service object which contains the task types, priority, etc... (texts and images)
             * @type {*}
             */
            vm.taskConverterService = TaskConverterService;

            /**
             * Filter the task states
             * @type {{}}
             */
            vm.selectedTaskStates = {};

            // collect all task states and build vm.selectedTaskStates
            for (var i = 0; i < vm.taskConverterService.taskStateOrder.length; i++) {
                var task = vm.taskConverterService.taskStateOrder[i];

                // by default the task should be displayed, unless it is closed
                vm.selectedTaskStates[task] = (task != 'DONE');
            }

            /**
             * List of users which is pre-filled based on the tasks fetched from REST API
             * @type {Array}
             */
            vm.users = [];

            /**
             * SearchField
             * @type {string}
             */
            vm.searchField = undefined;

            /**
             * Whether or not tasks have finished loading
             * @type {boolean}
             */
            vm.tasksLoaded = false;

            /**
             * A dictioanry of selected tasks
             * @type {{}}
             */
            vm.selectedTasks = {};

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
            */
            vm.currentLimit = tasksPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
            */
            vm.currentOffset = 0;

            /**
             * default sorting
             */
            vm.orderBy = "task_id";
            vm.orderDir = 'desc';
            /**
             * filters for the request
             */
            vm.filters = {};

            /**
             * Default sort column for task table
             * @type {string}
             */
            vm.sortColumn = "task_id";

            /**
             * Default sort order for task table
             * @type {boolean}
             */
            vm.sortReverse = true;

            /**
             * Whether or not all tasks are selected
             * @type {boolean}
             */
            vm.allTasksSelected = false;

            vm.getTasks(vm.currentLimit, vm.currentOffset);
        };

        /**
         * Event called when the task state filter has changed
         */
        vm.taskStateFilterChanged = function () {
            updateFilteredTasks();
        };

        /**
         * Gets the task list for the current project
         */
        vm.getTasks = function (limit, offset) {
            // if no limit is defined, use the default ``changesPerPage``
            if (limit === undefined) {
                limit = tasksPerPage;
            }
            // if no offset is defined, begin at 0
            if (offset === undefined) {
                offset = 0;
            }
            /**
             * Defines the filters for the REST API for recent changes
             * @type {{limit: *, offset: *, model: (undefined|*)}}
             */
            vm.filters['limit'] = limit;
            vm.filters['offset'] = offset;

            if (vm.orderBy && vm.orderDir) {
                vm.filters['ordering'] = (vm.orderDir === 'asc' ? '-' : '') + vm.orderBy;
            }

            // check if a project filter is selected
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                vm.filters['projects_recursive'] =  vm.selectedProjects[0];
            }

            // delete the filter if vm.selectedProjects is empty
            if (vm.filters['projects_recursive'] && vm.selectedProjects.length === 0) {
                delete vm.filters['projects_recursive'];
            }

            // add the ids to exclude
            if (vm.alreadyAddedTaskPks.length !== 0) {
                vm.filters['id'] = vm.alreadyAddedTaskPks.join(',');
            }

            // delete the filter if vm.alreadyAddedTaskPks is empty
            if (vm.filters['id'] && vm.alreadyAddedTaskPks.length === 0) {
                delete vm.filters['id'];
            }

            // delete the search filter if vm.searchField is empty
            if (vm.filters['search'] === "") {
                delete vm.filters['search'];
            }

            // add the state vm.filters to the query
            vm.filters['state'] = getSelectedTaskStateList().join(',');

            return TaskRestService.query(vm.filters).$promise.then(
                function success (response) {
                    vm.tasks = response;

                    var count = response.$httpHeaders(PaginationCountHeader.getHeaderName());

                    if (count) {
                        vm.numberOfTasks = count;
                    }
                    vm.tasksLoaded = true;

                    // iterate over vm.tasks and collect users so we can provide an initial selection of users
                    for (var i = 0; i < vm.tasks.length; i++) {
                        vm.users.push(vm.tasks[i].created_by);
                        // iterate over all assigned_users
                        for (var j = 0; j < vm.tasks[i].assigned_users.length; j++) {
                            vm.users.push(vm.tasks[i].assigned_users[j]);
                        }
                    }
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to load tasks"));
                }
            );
        };

        /**
         * Returns a list of current selected task state filters from vm.selectedTaskStates, which is a dictionary
         *
         * This equals an Object.keys(vm.selectedTaskStates) where vm.selectedTaskStates[$key] == true
         * @returns {Array}
         */
        var getSelectedTaskStateList = function () {
            return Object.keys(vm.selectedTaskStates).filter(function (key) {
                return vm.selectedTaskStates[key] === true;
            });
        };

        /**
         * Select all tasks
         */
        vm.selectAllTasks = function () {
            if (vm.allTasksSelected) {
                vm.selectedTasks = {};

                for (var i = 0; i < vm.filteredTasks.length; i++) {
                    vm.selectedTasks[vm.filteredTasks[i].pk] = true;
                }
            } else {
                // deselect all tasks
                vm.selectedTasks = {};
            }
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * tasksPerPage;
            vm.currentLimit = tasksPerPage;
            vm.allTasksSelected = false;
            vm.selectedTasks = {};

            vm.getTasks(vm.currentLimit, vm.currentOffset);
        };

        /**
         * Update Filtered Tasks
         */
        var updateFilteredTasks = function () {
            vm.filteredTasks.length = 0;

            for (var i = 0; i < vm.tasks.length; i++) {
                var task = vm.tasks[i];

                // check if this task is in alreadyAddedTaskPks
                if (alreadyAddedTaskPks.indexOf(task.pk) >= 0) {
                    continue;
                }

                vm.filteredTasks.push(task);
            }
        };

        /**
         * save the searchString for filtering
         * @param searchString
         */
        vm.doSearch = function (searchString) {
            vm.searchField = searchString;
        };

        vm.cancelSearch = function () {
            vm.searchField = "";
            console.log("cancel search");
        };

        vm.cancel = function () {
            $uibModalInstance.dismiss();
        };

        /**
         * On Button Click - add the selected tasks to the kanban board
         * this collects all task pks and returns them to the screen/component that called the modal dialog (via
         * $uibModalInstance.close(selectedTaskPkList))
         */
        vm.addToKanban = function () {
            var selectedTaskPkList = [];

            // iterate over selectedTasks dictionary and collect the PKs

            for (var key in vm.selectedTasks) {
                if (vm.selectedTasks.hasOwnProperty(key)) {
                    if (vm.selectedTasks[key] === true) {
                        selectedTaskPkList.push(key);
                    }
                }
            }

            $uibModalInstance.close(selectedTaskPkList);
        };

        /**
         * Counts the number of selected tasks in the dictionary
         */
        vm.getNumberOfSelectedTasks = function () {
            var selectedTaskPkList = [];

            // iterate over selectedTasks dictionary and collect the PKs

            for (var key in vm.selectedTasks) {
                if (vm.selectedTasks.hasOwnProperty(key)) {
                    if (vm.selectedTasks[key] === true) {
                        selectedTaskPkList.push(key);
                    }
                }
            }

            return selectedTaskPkList.length;
        };

        // Watch potential filter settings and update vm.filteredTasks
        $scope.$watchGroup(
            ["vm.tasks", "vm.searchField", "vm.selectedProjects", "vm.selectedUsers"],
            updateFilteredTasks
        );

        vm.resetPaging = function () {
            vm.currentOffset = 0;
            vm.currentPage = 1;
        };

        $scope.$on("project-removed-from-filter-selection", function () {
            vm.selectedProjects = [];
            vm.resetPaging();
            vm.getTasks(vm.currentLimit, vm.currentOffset);
        });

        // Watch potential filter settings and update vm.filteredTasks
        $scope.$watch("vm.selectedProjects", function () {
            vm.resetPaging();
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                vm.getTasks(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        // Watch potential filter settings and update vm.filteredTasks
        $scope.$watch("vm.selectedTaskStates", function () {
            vm.resetPaging();
            vm.getTasks(vm.currentLimit, vm.currentOffset);
        }, true);

        // Watch potential search and update getTasks
        $scope.$watch("vm.searchField", function () {
            if (vm.searchField !== undefined && (vm.searchField.length >= 3 || vm.searchField.length === 0)) {
                vm.filters['search'] = vm.searchField.toLowerCase();
                vm.resetPaging();
                vm.getTasks(vm.currentLimit, vm.currentOffset);
            }
        }, true);
    });
})();
