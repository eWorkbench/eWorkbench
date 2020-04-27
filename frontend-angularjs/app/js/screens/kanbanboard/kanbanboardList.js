/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Component for displaying and filtering a Kanbanboard List
     */
    module.component('kanbanboardList', {
        templateUrl: 'js/screens/kanbanboard/kanbanboardList.html',
        controller: 'KanbanboardListController',
        controllerAs: 'vm',
        bindings: {}
    });

    /**
     * Kanbanboard List Controller
     *
     * Displays a Kanbanboard List and provides filters
     */
    module.controller('KanbanboardListController', function (
        $scope,
        $stateParams,
        $q,
        $timeout,
        AuthRestService,
        KanbanboardRestService,
        IconImagesService,
        gettextCatalog,
        toaster,
        PaginationCountHeader,
        DynamicTableSettingsService
    ) {
        'ngInject';

        var
            vm = this,
            /**
             * Config: Number of kanbanboards displayed per page
             * @type {number}
             * */
            kanbanboardsPerPage = 20;

        this.$onInit = function () {
            /**
             * Current Kanbanboard List View Type ('list' or 'card')
             * @type {string}
             */
            vm.currentView = 'card';

            /**
             * A list of Kanbanboards (fetched from REST API)
             * @type {Array}
             */
            vm.kanbanboards = [];

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * the currently selected project for filter
             */
            vm.selectedProjects = undefined;

            /**
             * List of users which is pre-filled based on the kanbanboards fetched from REST API
             * @type {Array}
             */
            vm.users = [];

            /**
             * SearchField
             * @type {string}
             */
            vm.searchField = undefined;

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentLimit = kanbanboardsPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentOffset = 0;

            /**
             * default sorting
             * must be the same as in app/js/services/dynamicTableSettings/defaultTableStates.js
             */
            vm.defaultOrderBy = "title";
            vm.defaultOrderDir = "asc";
            vm.orderBy = vm.defaultOrderBy;
            vm.orderDir = vm.defaultOrderDir;

            var sortOptions = DynamicTableSettingsService.getColumnSortingAndMatchNameToField('grid_state_kanbandboards');

            if (sortOptions['sortField']) {
                vm.orderBy = sortOptions['sortField'];
            }

            if (sortOptions['sortDir']) {
                vm.orderDir = sortOptions['sortDir'];
            }

            /**
             * filters for the request
             */
            vm.filters = {};

            /**
             * whether the kanbanboard data has been loaded
             * @type {boolean}
             */
            vm.kanbanboardsLoaded = false;

            /**
             * Load the complete and unfiltered dataset only if no filter is set which can be caused by navigating here
             * from the projects sidebar. Otherwise don't load the full dataset because the filter applied to the
             * search field will trigger the correct API call.
             */
            if (!$stateParams.filterProjects) {
                vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
            }
        };

        //is triggered when the task was deleted, trashed or restored (genericDeleteMenu.js)
        $scope.$on('objectDeletedEvent', function () {
            vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on('objectTrashedEvent', function () {
            // check if this was the last element on this page and change to the actual last page
            if (vm.kanbanboards.length === 1) {
                vm.currentPage -= 1;
                vm.currentOffset -= kanbanboardsPerPage;
            }

            vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on('objectRestoredEvent', function () {
            vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
        });

        /**
         * Query Kanbanboards (either with or without a project)
         */
        vm.getKanbanboards = function (limit, offset) {
            // if no limit is defined, use the default ``changesPerPage``
            if (limit === undefined) {
                limit = kanbanboardsPerPage;
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
                vm.filters['created_by'] = vm.selectedUsers;
            }

            // delete the filter if vm.selectedUsers is empty
            if (vm.filters['created_by'] && vm.selectedUsers.length === 0) {
                delete vm.filters['created_by'];
            }

            // delete the search filter if vm.searchField is empty
            if (vm.filters['search'] === "") {
                delete vm.filters['search'];
            }

            return KanbanboardRestService.query(vm.filters).$promise.then(
                function success (response) {
                    vm.kanbanboards.length = 0;
                    for (var t = 0; t < response.length; t++) {
                        vm.kanbanboards.push(response[t]);
                    }

                    vm.numberOfKanbanboards = response.$httpHeaders(PaginationCountHeader.getHeaderName());

                    // iterate over vm.kanbanboards and collect users so we can provide an initial selection of users
                    for (var i = 0; i < vm.kanbanboards.length; i++) {
                        // add user that created the kanbanboard
                        vm.users.push(vm.kanbanboards[i].created_by);
                    }
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load kanbanboards"));
                    console.log(rejection);
                }
            ).finally(function () {
                vm.kanbanboardsLoaded = true;
            });
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * kanbanboardsPerPage;
            vm.currentLimit = kanbanboardsPerPage;

            vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
        };

        vm.resetPaging = function () {
            vm.currentOffset = 0;
            vm.currentPage = 1;
        };

        $scope.$on("project-removed-from-filter-selection", function () {
            vm.selectedProjects = [];
            vm.resetPaging();
            vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on("user-removed-from-filter-selection", function () {
            vm.selectedUsers = [];
            vm.resetPaging();
            vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
        });

        $scope.$watch("vm.selectedProjects", function () {
            vm.resetPaging();
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.selectedUsers", function () {
            vm.resetPaging();
            if (vm.selectedUsers && vm.selectedUsers.length > 0) {
                vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.searchField", function () {
            if (vm.searchField !== undefined && (vm.searchField.length >= 3 || vm.searchField.length === 0)) {
                vm.filters['search'] = vm.searchField.toLowerCase();
                vm.resetPaging();
                vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
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
                vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
            }
            if ((newValue !== oldValue) && (vm.orderBy !== null)) {
                // triggered when sorting by column or direction has changed (But not on sort-reset)
                vm.getKanbanboards(vm.currentLimit, vm.currentOffset);
            }
        }, true);
    });
})();
