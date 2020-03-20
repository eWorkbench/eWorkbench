/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Component for displaying and filtering a Task List
     */
    module.component('taskList', {
        templateUrl: 'js/screens/task/taskList.html',
        controller: 'TaskListController',
        controllerAs: 'vm',
        bindings: {}
    });

    module.controller('TaskListController', function (
        $scope,
        $state,
        $stateParams,
        $q,
        $timeout,
        AuthRestService,
        FilterUrlStateService,
        IconImagesService,
        TaskConverterService,
        TaskRestService,
        DynamicTableSettingsService,
        DefaultTableStates,
        gettextCatalog,
        toaster,
        PaginationCountHeader
    ) {
        'ngInject';

        var
            vm = this,
            /**
             * Config: Number of tasks displayed per page
             * @type {number}
             * */
            tasksPerPage = 20,
            // disable watchers until all filters are initialized
            enableWatchers = false;

        this.$onInit = function () {
            /**
             * Current Task List View Type ('list' or 'card'; used to have 'kanban')
             * @type {string}
             */
            vm.currentView = 'list';

            /**
             * A list of tasks (fetched from REST API)
             * @type {Array}
             */
            vm.tasks = [];

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
            vm.defaultOrderBy = "task_id";
            vm.defaultOrderDir = "asc";
            vm.orderBy = vm.defaultOrderBy;
            vm.orderDir = vm.defaultOrderDir;

            var sortOptions = DynamicTableSettingsService.getColumnSortingAndMatchNameToField('grid_state_tasks');

            if (sortOptions['sortField']) {
                vm.orderBy = sortOptions['sortField'];
            }

            if (sortOptions['sortDir']) {
                vm.orderDir = sortOptions['sortDir'];
            }

            /**
             * Filter the task states
             * @type {{}}
             */
            vm.selectedTaskStates = {};

            // collect all task states and build vm.selectedTaskStates
            for (var i = 0; i < vm.taskConverterService.taskStateOrder.length; i++) {
                var task = vm.taskConverterService.taskStateOrder[i];

                // by default the task should be displayed, unless it is closed
                vm.selectedTaskStates[task] = (task !== 'CLOSE');
            }

            /**
             * List of users which is pre-filled based on the tasks fetched from REST API
             * @type {Array}
             */
            vm.users = [];

            /**
             * filters for the request
             */
            vm.filters = {};

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

            initFilterParams();

            vm.getTasks(vm.currentLimit, vm.currentOffset);
        };

        /**
         * Initialize filter params
         */
        var initFilterParams = function () {
            if ($state.params.filterSelectedTaskStates) {
                // make sure task states is always an array
                if (!Array.isArray($state.params.filterSelectedTaskStates)) {
                    $state.params.filterSelectedTaskStates = [$state.params.filterSelectedTaskStates];
                }

                for (var i = 0; i < vm.taskConverterService.taskStateOrder.length; i++) {
                    var state = vm.taskConverterService.taskStateOrder[i],
                        enabled = ($state.params.filterSelectedTaskStates.indexOf(state) >= 0);

                    vm.selectedTaskStates[state] = enabled;
                }
            }

            vm.selectedProjects = $state.params.filterProjects ? [$state.params.filterProjects] : [];
        };

        /**
         * callback for drag and drop (in kanban view)
         * @param event
         * @param index
         * @param item  the task which is dragged
         * @param external
         * @param type
         * @param state  the task state where the task is dragged to
         * @param project  the project where the task is moved to
         */
        vm.dndCallback = function (event, index, item, external, type, state, project) {
            // update state of item
            if (item.state != state || item.project != project) {
                item.state = state;
                item.project_pk = project;

                TaskRestService.update(item).$promise.then(
                    function success (response) {
                        toaster.pop('success', gettextCatalog.getString("Task moved!"));
                        item = response;

                    },
                    function error (rejection) {
                        toaster.pop('error', gettextCatalog.getString("Failed to move task!"));
                    }
                );
                //return item;
            } else {
                // state has not changed
            }
        };

        //is triggered when the task was deleted, trashed or restored (genericDeleteMenu.js)
        $scope.$on('objectDeletedEvent', function () {
            vm.getTasks(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on('objectTrashedEvent', function () {
            // check if this was the last element on this page and change to the actual last page
            if (vm.tasks.length === 1) {
                vm.currentPage -= 1;
                vm.currentOffset -= tasksPerPage;
            }
            vm.getTasks(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on('objectRestoredEvent', function () {
            vm.getTasks(vm.currentLimit, vm.currentOffset);
        });

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
                vm.filters['ordering'] = (vm.orderDir === 'asc' ? '' : '-') + vm.orderBy;
            } else {
                vm.filters['ordering'] = null;
            }

            // check if a project filter is selected
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                vm.filters['projects_recursive'] = vm.selectedProjects[0];
            }

            // delete the filter if vm.selectedProjects is empty
            if (vm.filters['projects_recursive'] && vm.selectedProjects.length === 0) {
                delete vm.filters['projects_recursive'];
            }

            // check if a user filter is selected
            if (vm.selectedUsers && vm.selectedUsers.length > 0) {
                vm.filters['assigned_users'] = vm.selectedUsers;
            }

            // delete the filter if vm.selectedUsers is empty
            if (vm.filters['assigned_users'] && vm.selectedUsers.length === 0) {
                delete vm.filters['assigned_users'];
            }

            // delete the search filter if vm.searchField is empty
            if (vm.filters['search'] === "") {
                delete vm.filters['search'];
            }

            // add the state vm.filters to the query
            vm.filters['state'] = getSelectedTaskStateList().join(',');

            return TaskRestService.query(vm.filters).$promise.then(
                function success (response) {
                    // load response into vm.tasks array without changing the reference used by angular-ui-grid
                    vm.tasks.length = 0;
                    for (var t = 0; t < response.length; t++) {
                        vm.tasks.push(response[t]);
                    }

                    vm.numberOfTasks = response.$httpHeaders(PaginationCountHeader.getHeaderName()) || 0;

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
            ).finally(function () {
                vm.tasksLoaded = true;

                // enable watchers after initial load
                enableWatchers = true;
            });
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * tasksPerPage;
            vm.currentLimit = tasksPerPage;

            vm.getTasks(vm.currentLimit, vm.currentOffset);
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

        vm.resetPaging = function () {
            vm.currentOffset = 0;
            vm.currentPage = 1;
        };

        $scope.$on("project-removed-from-filter-selection", function () {
            if (!enableWatchers) {
                return;
            }

            vm.selectedProjects = [];
            vm.resetPaging();
            vm.getTasks(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on("user-removed-from-filter-selection", function () {
            if (!enableWatchers) {
                return;
            }

            vm.selectedUsers = [];
            vm.resetPaging();
            vm.getTasks(vm.currentLimit, vm.currentOffset);
        });

        $scope.$watch("vm.selectedProjects", function () {
            if (!enableWatchers) {
                return;
            }

            vm.resetPaging();
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                vm.getTasks(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.selectedUsers", function () {
            if (!enableWatchers) {
                return;
            }

            vm.resetPaging();
            if (vm.selectedUsers && vm.selectedUsers.length > 0) {
                vm.getTasks(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.selectedTaskStates", function () {
            if (!enableWatchers) {
                return;
            }

            // When selected task states change, we also need to update the url in the browser
            //FilterUrlStateService.setFilterOption('filterSelectedTaskStates', getSelectedTaskStateList());
            vm.resetPaging();
            if (vm.selectedTaskStates) {
                vm.getTasks(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        // Watch potential search and update getTasks
        $scope.$watch("vm.searchField", function () {
            if (!enableWatchers) {
                return;
            }

            if (vm.searchField !== undefined && (vm.searchField.length >= 3 || vm.searchField.length === 0)) {
                vm.filters['search'] = vm.searchField.toLowerCase();
                vm.resetPaging();
                vm.getTasks(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("[vm.orderBy, vm.orderDir]", function (newValue, oldValue) {
            /**
             *  When the user changes the column-ordering, vm.gridApi.core.on.sortChanged() in tableViewGrid
             *  is triggered, which then modifies vm.orderBy and vm.orderDir. This change is detected here
             *  and get<Element>() is executed with the ordering-filter using the new values of orderBy/orderDir
            */
            if ((newValue[0] === null) && (oldValue[0] !== vm.defaultOrderBy)) {
                // triggered when the sorting is reset (i.e. when newValue[0] is null),
                // defaultOrderBy/defaultOrderDir is applied to the order-filter.
                // Only applies when the change didn't occur from the default to null (e.g. on page-loading)
                vm.orderBy = vm.defaultOrderBy;
                vm.orderDir = vm.defaultOrderDir;
                vm.getTasks(vm.currentLimit, vm.currentOffset);
            }
            if ((newValue !== oldValue) && (vm.orderBy !== null)) {
                // triggered when sorting by column or direction has changed (But not on sort-reset)
                vm.getTasks(vm.currentLimit, vm.currentOffset);
            }
        }, true);
    });
})();
