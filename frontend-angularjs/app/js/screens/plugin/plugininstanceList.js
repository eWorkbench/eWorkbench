/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Component for displaying and filtering a Plugin Instance List
     */
    module.component('plugininstanceList', {
        templateUrl: 'js/screens/plugin/plugininstanceList.html',
        controller: 'PlugininstanceListController',
        controllerAs: 'vm',
        bindings: {}
    });

    module.controller('PlugininstanceListController', function (
        $scope,
        $state,
        $stateParams,
        $q,
        $timeout,
        AuthRestService,
        FilterUrlStateService,
        IconImagesService,
        PlugininstanceRestService,
        PluginRestService,
        DynamicTableSettingsService,
        DefaultTableStates,
        gettextCatalog,
        toaster,
        PaginationCountHeader
    ) {
        'ngInject';

        var vm = this,
            /**
             * Config: Number of plugin instances displayed per page
             * @type {number}
             * */
            plugininstancesPerPage = 20,
            // disable watchers until all filters are initialized
            enableWatchers = false;

        this.$onInit = function () {
            /**
             * Current Plugin Instance List View Type ('list' or 'card';)
             * @type {string}
             */
            vm.currentView = 'list';

            /**
             * A list of plugin instances (fetched from REST API)
             * @type {Array}
             */
            vm.plugininstances = [];

            /**
             * List of available Plugins
             * @type {Array}
             */
            vm.plugins = [];

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentLimit = plugininstancesPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentOffset = 0;

            /**
             * default sorting
             * must be the same as in app/js/services/dynamicTableSettings/defaultTableStates.js
             */
            vm.defaultOrderBy = "plugin_instance_id";
            vm.defaultOrderDir = "asc";
            vm.orderBy = vm.defaultOrderBy;
            vm.orderDir = vm.defaultOrderDir;

            var sortOptions =
                DynamicTableSettingsService.getColumnSortingAndMatchNameToField(
                    'grid_state_plugin_instances'
                );

            if (sortOptions['sortField']) {
                vm.orderBy = sortOptions['sortField'];
            }

            if (sortOptions['sortDir']) {
                vm.orderDir = sortOptions['sortDir'];
            }

            /**
             * List of users which is pre-filled based on the plugin instances fetched from REST API
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
            vm.plugininstancesLoaded = false;

            initFilterParams();

            vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
        };

        /**
         * Initialize filter params
         */
        var initFilterParams = function () {
            vm.selectedProjects = $state.params.filterProjects ? [$state.params.filterProjects] : [];
        };

        //is triggered when the plugin instance was deleted, trashed or restored (genericDeleteMenu.js)
        $scope.$on('objectDeletedEvent', function () {
            vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on('objectTrashedEvent', function () {
            // check if this was the last element on this page and change to the actual last page
            if (vm.plugininstances.length === 1) {
                vm.currentPage -= 1;
                vm.currentOffset -= plugininstancesPerPage;
            }
            vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on('objectRestoredEvent', function () {
            vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
        });

        /**
         * Get all available plugins to fill the filter
         */
        PluginRestService.query().$promise.then(
            function success (response) {
                // store plugins
                vm.plugins = response;
            },
            function error (rejection) {
                console.log(rejection);
                toaster.pop('error', gettextCatalog.getString("Error"),
                    gettextCatalog.getString("Failed to query plugins"));
            }
        );

        /**
         * Gets the plugin instance list for the current project
         */
        vm.getPlugininstances = function (limit, offset) {
            // if no limit is defined, use the default ``changesPerPage``
            if (limit === undefined) {
                limit = plugininstancesPerPage;
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

            // check if a plugin type filter is selected
            if (vm.selectedPlugin && vm.selectedPlugin.length > 0) {
                vm.filters['plugin'] = vm.selectedPlugin;
            }

            // delete the filter if vm.selectedPlugin is empty
            if (vm.filters['plugin'] && vm.selectedPlugin.length === 0) {
                delete vm.filters['plugin'];
            }


            // delete the filter if vm.selectedUsers is empty
            if (vm.filters['created_by'] && vm.selectedUsers.length === 0) {
                delete vm.filters['created_by'];
            }

            // delete the search filter if vm.searchField is empty
            if (vm.filters['search'] === "") {
                delete vm.filters['search'];
            }

            return PlugininstanceRestService.query(vm.filters).$promise.then(
                function success (response) {
                    // load response into vm.plugininstances array without
                    // changing the reference used by angular-ui-grid
                    vm.plugininstances.length = 0;
                    for (var t = 0; t < response.length; t++) {
                        vm.plugininstances.push(response[t]);
                    }

                    vm.numberOfPlugininstances = response.$httpHeaders(PaginationCountHeader.getHeaderName()) || 0;

                    // iterate over vm.plugininstances and collect users so we can provide an initial selection of users
                    for (var i = 0; i < vm.plugininstances.length; i++) {
                        vm.users.push(vm.plugininstances[i].created_by);
                    }
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to load plugin contents"));
                }
            ).finally(function () {
                vm.plugininstancesLoaded = true;

                // enable watchers after initial load
                enableWatchers = true;
            });
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * plugininstancesPerPage;
            vm.currentLimit = plugininstancesPerPage;

            vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
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
            vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on("user-removed-from-filter-selection", function () {
            if (!enableWatchers) {
                return;
            }

            vm.selectedUsers = [];
            vm.resetPaging();
            vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on("plugin-removed-from-filter-selection", function () {
            vm.selectedPlugin = [];
            vm.resetPaging();
            vm.getFiles(vm.currentLimit, vm.currentOffset);
        });

        $scope.$watch("vm.selectedProjects", function () {
            if (!enableWatchers) {
                return;
            }

            vm.resetPaging();
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.selectedUsers", function () {
            if (!enableWatchers) {
                return;
            }

            vm.resetPaging();
            if (vm.selectedUsers && vm.selectedUsers.length > 0) {
                vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        // Watch potential search and update getPlugininstances
        $scope.$watch("vm.searchField", function () {
            if (!enableWatchers) {
                return;
            }

            if (vm.searchField !== undefined && (vm.searchField.length >= 3 || vm.searchField.length === 0)) {
                vm.filters['search'] = vm.searchField.toLowerCase();
                vm.resetPaging();
                vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.selectedPlugin", function () {
            vm.resetPaging();
            if (vm.selectedPlugin && vm.selectedPlugin.length > 0) {
                vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
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
                vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
            }
            if ((newValue !== oldValue) && (vm.orderBy !== null)) {
                // triggered when sorting by column or direction has changed (But not on sort-reset)
                vm.getPlugininstances(vm.currentLimit, vm.currentOffset);
            }
        }, true);
    });
})();
