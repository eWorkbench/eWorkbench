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
        PaginationCountHeader,
        DynamicTableSettingsService
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
             * must be the same as in app/js/services/dynamicTableSettings/defaultTableStates.js
             */
            vm.defaultOrderBy = 'name';
            vm.defaultOrderDir = 'desc';
            vm.orderBy = vm.defaultOrderBy;
            vm.orderDir = vm.defaultOrderDir;

            var sortOptions = DynamicTableSettingsService.getColumnSortingAndMatchNameToField('grid_state_projects');

            if (sortOptions['sortField']) {
                vm.orderBy = sortOptions['sortField'];
            }

            if (sortOptions['sortDir']) {
                vm.orderDir = sortOptions['sortDir'];
            }

            /**
             * default parent project
             */
            vm.parentProject = null;

            vm.taskConverterService = TaskConverterService;

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

            vm.currentUser = AuthRestService.getCurrentUser();
            vm.projectsLoaded = false;

            /**
             * Gets the correct project icon
             * @type {string}
             */
            vm.projectIcon = IconImagesService.mainElementIcons.project;

            vm.loadProjects();
        };

        //is triggered when the project was deleted, trashed or restored (genericDeleteMenu.js)
        $scope.$on('objectDeletedEvent', function () {
            vm.loadProjects();
        });
        $scope.$on('objectTrashedEvent', function () {
            // check if this was the last element on this page and change to the actual last page
            if (vm.projects.length === 1) {
                vm.currentPage -= 1;
                vm.currentOffset -= projectsPerPage;
            }

            vm.loadProjects();
        });
        $scope.$on('objectRestoredEvent', function () {
            vm.loadProjects();
        });

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
        vm.loadProjects = function () {
            var parentProject = vm.parentProject,
                limit = vm.currentLimit,
                offset = vm.currentOffset;

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
                    vm.projects.length = 0;
                    for (var i = 0; i < response.length; i++) {
                        vm.projects.push(response[i]);
                    }

                    var count = response.$httpHeaders(PaginationCountHeader.getHeaderName());

                    if (count) {
                        vm.numberOfProjects = count;
                    }
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to load projects"));
                }
            ).finally(function () {
                vm.projectsLoaded = true;
            });
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
            vm.loadProjects();
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * projectsPerPage;
            vm.currentLimit = projectsPerPage;
            vm.loadProjects();
        };

        $scope.$watch("[vm.orderBy, vm.orderDir]", function (newValue, oldValue) {
            /**
             *  When the user changes the column-ordering, vm.gridApi.core.on.sortChanged() in tableViewGrid
             *  is triggered, which then modifies vm.orderBy and vm.orderDir. This change is detected here
             *  and loadProjects() is executed with the ordering-filter using the new values of orderBy/orderDir
             */
            if ((newValue[0] === null) && (oldValue[0] !== vm.defaultOrderBy)) {
                // triggered when the sorting is reset (i.e. when newValue[0] is null),
                // defaultOrderBy/defaultOrderDir is applied to the order-filter.
                // Only applies when the change didn't occur from the default to null (e.g. on page-loading)
                vm.orderBy = vm.defaultOrderBy;
                vm.orderDir = vm.defaultOrderDir;

                vm.loadProjects();
            }
            if ((newValue !== oldValue) && (vm.orderBy !== null)) {
                // triggered when sorting by column or direction has changed (But not on sort-reset)
                vm.loadProjects();
            }
        }, true);

    });
})();

