/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Projects Component
     *
     * Displays a project list
     */
    module.component('projectList', {
        templateUrl: 'js/screens/project/projectList.html',
        controller: 'ProjectListController',
        controllerAs: 'vm'
    });

    /**
     * Projects Controller
     *
     * Loads a project list and provides edit and delete buttons
     */
    module.controller('ProjectListController', function (
        $scope,
        $timeout,
        $http,
        $element,
        responsiveBreakpoints,
        toaster,
        AuthRestService,
        projectCreateModalService,
        ProjectRestService,
        gettextCatalog,
        IconImagesService,
        TaskConverterService,
        uiGridConstants,
        PaginationCountHeader
    ) {
        'ngInject';

        var vm = this,

            /**
             * Config: Number of projects displayed per page
             * @type {number}
             * */
            projectsPerPage = 20;

        this.$onInit = function () {
            /**
             * Current Task List View Type ('list' or 'card'; used to have 'kanban')
             * @type {string}
             */
            vm.currentView = 'list';

            /**
             * Config: Height of row per entry in grid view
             * @type {number}
             * */
            vm.gridRowHeight = 30;

            /**
             * Project tree
             * @type {Array}
             */
            vm.projects = [];

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentLimit = projectsPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentOffset = 0;

            /**
             * default sorting
             */
            vm.orderBy = 'name';
            vm.orderDir = 'desc';

            /**
             * default parent project
             */
            vm.parentProject = null;

            /** gets the TaskConverterService */
            vm.taskConverterService = TaskConverterService;

            /**
             * First Column is the Expanding property: Project name
             * @type {{}}
             */
            vm.treeGridExpandingProperty = {
                field: 'name',
                displayName: gettextCatalog.getString("Project Name"),
                sortable: true,
                cellTemplate: '<project-link project="row.branch" edit="false">' +
                    '</project-link>'
            };

            /**
             * Watch responsive breakpoints for XS screens and force to card view
             */
            $scope.$watch(function () {
                return responsiveBreakpoints['xs']
            }, function (newVal, oldVal) {
                if (newVal === true) {
                    console.log("XS Screen detected, forcing to view");
                    vm.currentView = 'card';
                }
            });

            /**
             * Columns definition
             */
            var expandColumn = {
                name: gettextCatalog.getString("Expand"),
                headerCellTemplate: '<div></div>',
                enableColumnMenu: false,
                enableSorting: false,
                enableHiding: false,
                field: 'pk',
                cellTemplate: 'js/screens/project/expandableRowExpandTemplate.html',
                width: 25
            };

            var nameColumn = {
                name: gettextCatalog.getString("Project Name"),
                field: 'object',
                enableSorting: false,
                cellTemplate: '<project-link project="row.entity"></project-link>',
                headerCellTemplate: 'js/screens/project/gridNameHeaderCell.html'
            };

            var progressColumn = {
                name: gettextCatalog.getString("Progress"),
                field: 'tasks_status',
                enableSorting: false,
                cellTemplate: '<task-status-display-widget task-status="row.entity.tasks_status">' +
                    '</task-status-display-widget>'
            };

            var startDateColumn = {
                name: gettextCatalog.getString("Start Date"),
                field: 'start_date',
                enableColumnMenu: false,
                cellTemplate: '<div>{{ row.entity.start_date | smallDateWithoutTime }}</div>',
                headerCellTemplate: 'js/screens/project/gridStartDateHeaderCell.html'
            };

            var stopDateColumn = {
                name: gettextCatalog.getString("Stop Date"),
                field: 'stop_date',
                enableColumnMenu: false,
                cellTemplate: '<div>{{ row.entity.stop_date | smallDateWithoutTime }}</div>',
                headerCellTemplate: 'js/screens/project/gridStopDateHeaderCell.html'
            };

            var projectStatusColumn = {
                name: gettextCatalog.getString("Done"),
                field: 'tasks_status_completed',
                enableSorting: false,
                cellTemplate: '<task-status-completed-widget task-status="row.entity.tasks_status">' +
                    '</task-status-completed-widget>'
            };

            var projectStateColumn = {
                name: gettextCatalog.getString("Status"),
                field: 'project_state',
                cellTemplate: '<project-state-widget project-state="row.entity.project_state">' +
                    '</project-state-widget>',
                headerCellTemplate: 'js/screens/project/gridProjectStateHeaderCell.html'
            };

            var projectDeleteColumn = {
                name: gettextCatalog.getString("Delete"),
                headerCellTemplate: '<div></div>',
                field: 'object',
                enableSorting: false,
                cellTemplate: '<generic-delete-menu-widget model-object="row.entity"></generic-delete-menu-widget>',
                width: 30
            };

            vm.columnDefsGridView = [
                expandColumn,
                nameColumn,
                progressColumn,
                startDateColumn,
                stopDateColumn,
                projectStatusColumn,
                projectStateColumn,
                projectDeleteColumn
            ];

            vm.gridOptions = {
                enableSorting: true,
                appScopeProvider: vm,
                enableGridMenu: true,
                enablePaginationControls: false,
                enableColumnResizing: true,
                rowHeight: vm.gridRowHeight,
                enableExpandableRowHeader: false,
                enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
                enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                showExpandAllButton: true,
                expandableRowTemplate: 'js/screens/project/expandableRowTemplate.html',
                columnDefs: vm.columnDefsGridView,
                onRegisterApi: function (gridApi) {
                    // call the first API grid handler with tree level 1 (first sub-tree)
                    vm.subGridHandler(gridApi, 1);
                }
            };

            /**
             * Remaining Column definitions
             * @type {Array}
             */
            vm.columnDefs = [
                // display task status (progress)
                {
                    field: 'tasks_status',
                    displayName: gettextCatalog.getString("Progress"),
                    cellTemplate: '<task-status-display-widget task-status="row.branch.tasks_status">' +
                        '</task-status-display-widget>'
                },
                {
                    field: 'start_date',
                    displayName: gettextCatalog.getString("Start Date"),
                    sortable: true,
                    cellTemplate: '<div>{{ row.branch.start_date | smallDateWithoutTime }}</div>'
                },
                {
                    field: 'stop_date',
                    displayName: gettextCatalog.getString("Stop Date"),
                    sortable: true,
                    cellTemplate: '<div>{{ row.branch.stop_date | smallDateWithoutTime }}</div>'
                },
                // number of completed tasks
                {
                    field: 'tasks_status_completed',
                    displayName: gettextCatalog.getString("Done"),
                    sortable: true,
                    sortingType: 'number',
                    cellTemplate: '<task-status-completed-widget task-status="row.branch.tasks_status">' +
                        '</task-status-completed-widget>'
                },
                {
                    field: 'project_state',
                    displayName: gettextCatalog.getString("Status"),
                    sortable: true,
                    cellTemplate: '<project-state-widget project-state="row.branch.project_state">' +
                        '</project-state-widget>'

                },
                {
                    displayName: '',
                    sortable: false,
                    cellTemplate: '<generic-delete-menu-widget model-object="row.branch">' +
                        '</generic-delete-menu-widget>'

                }
            ];

            // prevent ui-grid from catching scroll events,
            // so the user can scroll the page while the cursor is over the ui-grid
            $timeout(function () {
                var $viewport = $element.find('.ui-grid-render-container'),
                    scrollEventList = [
                        'touchstart', 'touchmove', 'touchend',
                        'keydown',
                        'wheel', 'mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'
                    ];

                scrollEventList.forEach(function (eventName) {
                    $viewport.unbind(eventName);
                });
            });

            vm.currentUser = AuthRestService.getCurrentUser();
            vm.projectsLoaded = false;

            /**
             * Gets the correct project icon
             * @type {string}
             */
            vm.projectIcon = IconImagesService.mainElementIcons.project;

            vm.loadProjects(vm.parentProject, vm.currentLimit, vm.currentOffset);
        };

        //is triggered when the project was deleted, trashed or restored (genericDeleteMenu.js)
        $scope.$on('objectDeletedEvent', function () {
            vm.loadProjects(vm.parentProject, vm.currentLimit, vm.currentOffset);
        });
        $scope.$on('objectTrashedEvent', function () {
            // check if this was the last element on this page and change to the actual last page
            if (vm.projects.length === 1) {
                vm.currentPage -= 1;
                vm.currentOffset -= projectsPerPage;
            }

            vm.loadProjects(vm.parentProject, vm.currentLimit, vm.currentOffset);
        });
        $scope.$on('objectRestoredEvent', function () {
            vm.loadProjects(vm.parentProject, vm.currentLimit, vm.currentOffset);
        });

        /**
         * Handles the process of expanding a parent project with all its sub-projects
         */
        vm.subGridHandler = function (gridApi, gridTreeLevel) {
            gridApi.expandable.on.rowExpandedStateChanged($scope, function (row) {
                if (row.isExpanded) {
                    row.entity.subGridOptions = {
                        enableSorting: false,
                        enableGridMenu: false,
                        enablePaginationControls: false,
                        enableColumnResizing: true,
                        rowHeight: vm.gridRowHeight,
                        enableExpandableRowHeader: false,
                        enableHorizontalScrollbar: uiGridConstants.scrollbars.NEVER,
                        enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                        showExpandAllButton: false,
                        expandableRowTemplate: 'js/screens/project/expandableRowTemplate.html',
                        columnDefs: vm.columnDefsGridView,
                        showHeader: false,
                        onRegisterApi: function (gridApi) {
                            // save reference to this API handler
                            var self = this;

                            // set scope variable for this API handler
                            self.gridTreeLevel = gridTreeLevel;

                            // call API handler for nested elements with increased grid tree level
                            vm.subGridHandler(gridApi, ++self.gridTreeLevel);
                        }
                    };

                    ProjectRestService.query({
                        parent_project: row.entity.pk
                    }).$promise.then(
                        function success (response) {
                            row.entity.subGridOptions.data = response;
                            row.entity.subGridOptions.gridTreeLevel = gridTreeLevel;
                        }
                    );
                }
            });
        };

        /**
         * Opens a modal dialog to create a new project
         */
        vm.createNewProject = function () {
            var modalInstance = projectCreateModalService.open();

            modalInstance.result.then(
                function created (project) {
                    projectCreateModalService.viewElement(project);
                }
            );
        };

        /**
         * Load projects from REST API
         * @returns {*}
         */
        vm.loadProjects = function (parentProject, limit, offset) {
            // if no limit is defined, use the default ``changesPerPage``
            if (limit === undefined) {
                limit = projectsPerPage;
            }

            // if no offset is defined, begin at 0
            if (offset === undefined) {
                offset = 0;
            }

            /**
             * Defines the filters for the REST API for recent changes
             * @type {{limit: *, offset: *, model: (undefined|*)}}
             */
            var filters = {
                limit: limit,
                offset: offset
            };

            // if no parent project is assigned use a different filter
            if (parentProject === null) {
                filters['parent_projects_and_orphans'] = true;
            } else {
                filters['parent_project'] = parentProject;
            }

            if (vm.orderBy && vm.orderDir) {
                filters['ordering'] = (vm.orderDir === 'asc' ? '' : '-') + vm.orderBy;
            } else {
                vm.filters['ordering'] = null;
            }

            return ProjectRestService.query(filters).$promise.then(
                function success (response) {
                    vm.projects = response;
                    var count = response.$httpHeaders(PaginationCountHeader.getHeaderName());

                    if (count) {
                        vm.numberOfProjects = count;
                    }

                    vm.gridOptions.data = vm.projects;
                    vm.projectsLoaded = true;
                }
            );
        };

        /**
         * Set orderBy
         */
        vm.tableSort = function (tableSortField) {
            if (!vm.orderBy || vm.orderBy !== tableSortField) {
                vm.orderBy = tableSortField;
                vm.orderDir = 'desc';
            } else {
                vm.orderDir = vm.orderDir === 'asc' ? 'desc' : 'asc';
            }
            vm.currentOffset = 0;
            vm.loadProjects(vm.parentProject, vm.currentLimit, vm.currentOffset);
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * projectsPerPage;
            vm.currentLimit = projectsPerPage;

            vm.loadProjects(vm.parentProject, vm.currentLimit, vm.currentOffset);
        };

    });
})();

