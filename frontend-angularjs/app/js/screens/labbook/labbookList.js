/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Component for displaying and filtering a Labbook List
     */
    module.component('labbookList', {
        templateUrl: 'js/screens/labbook/labbookList.html',
        controller: 'LabbookListController',
        controllerAs: 'vm',
        bindings: {}
    });

    /**
     * Labbook List Controller
     *
     * Displays a Labbook List and provides filters
     */
    module.controller('LabbookListController', function (
        $timeout,
        $scope,
        $stateParams,
        $q,
        AuthRestService,
        IconImagesService,
        LabbookRestService,
        DynamicTableSettingsService,
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
            labbooksPerPage = 20;


        this.$onInit = function () {
            /**
             * Current Contact List View Type (list or card)
             * @type {string}
             */
            vm.currentView = 'list';

            /**
             * A list of Labbooks (fetched from REST API)
             * @type {Array}
             */
            vm.labbooks = [];

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * List of users which is pre-filled based on the labbooks fetched from REST API
             * @type {Array}
             */
            vm.users = [];

            /**
             * save the string of the search input
             * @type {string}
             */
            vm.searchField = undefined;

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentLimit = labbooksPerPage;

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

            var sortOptions = DynamicTableSettingsService.getColumnSortingAndMatchNameToField('grid_state_labbooks');

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
             * whether the labbook data has been loaded
             * @type {boolean}
             */
            vm.labbooksLoaded = false;

            /**
             * Load the complete and unfiltered dataset only if no filter is set which can be caused by navigating here
             * from the projects sidebar. Otherwise don't load the full dataset because the filter applied to the
             * search field will trigger the correct API call.
             */
            if (!$stateParams.filterProjects) {
                vm.getLabbooks(vm.currentLimit, vm.currentOffset);
            }
        };

        //is triggered when the labbook was deleted, trashed or restored (genericDeleteMenu.js)
        $scope.$on('objectDeletedEvent', function () {
            vm.getLabbooks(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on('objectTrashedEvent', function () {
            // check if this was the last element on this page and change to the actual last page
            if (vm.labbooks.length === 1) {
                vm.currentPage -= 1;
                vm.currentOffset -= labbooksPerPage;
            }

            vm.getLabbooks(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on('objectRestoredEvent', function () {
            vm.getLabbooks(vm.currentLimit, vm.currentOffset);
        });

        /**
         * Query Labbooks
         */
        vm.getLabbooks = function (limit, offset) {
            // if no limit is defined, use the default ``changesPerPage``
            if (limit === undefined) {
                limit = labbooksPerPage;
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

            return LabbookRestService.query(vm.filters).$promise.then(
                function success (response) {
                    vm.labbooks.length = 0;
                    for (var t = 0; t < response.length; t++) {
                        vm.labbooks.push(response[t]);
                    }

                    vm.numberOfLabbooks = response.$httpHeaders(PaginationCountHeader.getHeaderName());

                    // iterate over vm.labbooks and collect users so we can provide an initial selection of users
                    for (var i = 0; i < vm.labbooks.length; i++) {
                        vm.users.push(vm.labbooks[i].created_by);
                    }
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load labbooks"));
                }
            ).finally(function () {
                vm.labbooksLoaded = true;
            });
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * labbooksPerPage;
            vm.currentLimit = labbooksPerPage;

            vm.getLabbooks(vm.currentLimit, vm.currentOffset);
        };

        vm.resetPaging = function () {
            vm.currentOffset = 0;
            vm.currentPage = 1;
        };

        $scope.$on("project-removed-from-filter-selection", function () {
            vm.selectedProjects = [];
            vm.resetPaging();
            vm.getLabbooks(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on("user-removed-from-filter-selection", function () {
            vm.selectedUsers = [];
            vm.resetPaging();
            vm.getLabbooks(vm.currentLimit, vm.currentOffset);
        });

        $scope.$watch("vm.selectedProjects", function () {
            vm.resetPaging();
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                vm.getLabbooks(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.selectedUsers", function () {
            vm.resetPaging();
            if (vm.selectedUsers && vm.selectedUsers.length > 0) {
                vm.getLabbooks(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        // Watch potential search and update getLabbooks
        $scope.$watch("vm.searchField", function () {
            if (vm.searchField !== undefined && (vm.searchField.length >= 3 || vm.searchField.length === 0)) {
                vm.filters['search'] = vm.searchField.toLowerCase();
                vm.resetPaging();
                vm.getLabbooks(vm.currentLimit, vm.currentOffset);
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
                vm.getLabbooks(vm.currentLimit, vm.currentOffset);
            }
            if ((newValue !== oldValue) && (vm.orderBy !== null)) {
                // triggered when sorting by column or direction has changed (But not on sort-reset)
                vm.getLabbooks(vm.currentLimit, vm.currentOffset);
            }
        }, true);
    });
})();
