/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Component for displaying and filtering a DSS Container List
     */
    module.component('dsscontainerList', {
        templateUrl: 'js/screens/dsscontainer/dsscontainerList.html',
        controller: 'DSSContainerListController',
        controllerAs: 'vm',
        bindings: {}
    });

    module.controller('DSSContainerListController', function (
        $scope,
        $state,
        $stateParams,
        $q,
        $timeout,
        AuthRestService,
        IconImagesService,
        DSSContainerRestService,
        DynamicTableSettingsService,
        DefaultTableStates,
        gettextCatalog,
        toaster,
        PaginationCountHeader,
        $http,
        restApiUrl
    ) {
        'ngInject';

        var vm = this,
            /**
             * Config: Number of DSS Containers displayed per page
             * @type {number}
             * */
            dsscontainersPerPage = 20,
            // disable watchers until all filters are initialized
            enableWatchers = false;

        this.$onInit = function () {
            /**
             * Current DSS Container ist View Type ('list' or 'card';)
             * @type {string}
             */
            vm.currentView = 'list';

            /**
             * A list of DSS Containers (fetched from REST API)
             * @type {Array}
             */
            vm.dsscontainers = [];

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentLimit = dsscontainersPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentOffset = 0;

            /**
             * default sorting
             * must be the same as in app/js/services/dynamicTableSettings/defaultTableStates.js
             */
            vm.defaultOrderBy = "dss_container_id";
            vm.defaultOrderDir = "asc";
            vm.orderBy = vm.defaultOrderBy;
            vm.orderDir = vm.defaultOrderDir;

            var sortOptions =
                DynamicTableSettingsService.getColumnSortingAndMatchNameToField(
                    'grid_state_dss_container'
                );

            if (sortOptions['sortField']) {
                vm.orderBy = sortOptions['sortField'];
            }

            if (sortOptions['sortDir']) {
                vm.orderDir = sortOptions['sortDir'];
            }

            /**
             * List of users which is pre-filled based on the DSS Containers fetched from REST API
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
            vm.dsscontainersLoaded = false;

            initFilterParams();

            vm.getDSSContainers(vm.currentLimit, vm.currentOffset);

            vm.loadDSSContainerHowToCmsText();
        };

        vm.loadDSSContainerHowToCmsText = function () {
            $http.get(restApiUrl + "cms/json/dss_container_list_how_to/").then(
                function success (response) {
                    vm.cmsDSSContainerListHowTo = response.data;
                },
                function error (rejection) {
                    vm.cmsDSSContainerListHowTo = null;
                }
            );
        };

        /**
         * Initialize filter params
         */
        var initFilterParams = function () {
            vm.selectedProjects = $state.params.filterProjects ? [$state.params.filterProjects] : [];
        };

        /**
         * Gets the DSS Container list for the current project
         */
        vm.getDSSContainers = function (limit, offset) {
            // if no limit is defined, use the default ``changesPerPage``
            if (limit === undefined) {
                limit = dsscontainersPerPage;
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

            // delete the search filter if vm.searchField is empty
            if (vm.filters['search'] === "") {
                delete vm.filters['search'];
            }

            return DSSContainerRestService.query(vm.filters).$promise.then(
                function success (response) {
                    // load response into vm.dsscontainers array without
                    // changing the reference used by angular-ui-grid
                    vm.dsscontainers.length = 0;
                    for (var t = 0; t < response.length; t++) {
                        vm.dsscontainers.push(response[t]);
                    }

                    vm.numberOfDSSContainers = response.$httpHeaders(PaginationCountHeader.getHeaderName()) || 0;

                    // iterate over vm.dsscontainers and collect users so we can provide an initial selection of users
                    for (var i = 0; i < vm.dsscontainers.length; i++) {
                        vm.users.push(vm.dsscontainers[i].created_by);
                    }
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to load DSS Containers"));
                }
            ).finally(function () {
                vm.dsscontainersLoaded = true;

                // enable watchers after initial load
                enableWatchers = true;
            });
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * dsscontainersPerPage;
            vm.currentLimit = dsscontainersPerPage;

            vm.getDSSContainers(vm.currentLimit, vm.currentOffset);
        };

        vm.resetPaging = function () {
            vm.currentOffset = 0;
            vm.currentPage = 1;
        };

        // Watch potential search and update getDSSContainers
        $scope.$watch("vm.searchField", function () {
            if (!enableWatchers) {
                return;
            }

            if (vm.searchField !== undefined && (vm.searchField.length >= 3 || vm.searchField.length === 0)) {
                vm.filters['search'] = vm.searchField.toLowerCase();
                vm.resetPaging();
                vm.getDSSContainers(vm.currentLimit, vm.currentOffset);
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
                vm.getDSSContainers(vm.currentLimit, vm.currentOffset);
            }
            if ((newValue !== oldValue) && (vm.orderBy !== null)) {
                // triggered when sorting by column or direction has changed (But not on sort-reset)
                vm.getDSSContainers(vm.currentLimit, vm.currentOffset);
            }
        }, true);
    });
})();
