/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Component for displaying and filtering a Note List
     */
    module.component('historyList', {
        templateUrl: 'js/screens/history/historyList.html',
        controller: 'HistoryListController',
        controllerAs: 'vm',
        bindings: {}
    });

    /**
     * History List Controller
     *
     * Displays a History List and provides filters
     */
    module.controller('HistoryListController', function (
        $scope,
        $stateParams,
        $q,
        $timeout,
        $filter,
        AuthRestService,
        IconImagesService,
        NoteRestService,
        gettextCatalog,
        toaster,
        PaginationCountHeader,
        WorkbenchElementsTranslationsService,
        PaginatedHistoryRestServiceFactory
    ) {
        'ngInject';

        var vm = this,
            /**
             * Config: Number of changes displayed per page
             * @type {number}
             * */
            changesPerPage = 10;

        this.$onInit = function () {
            /**
             * A list of History (fetched from REST API)
             * @type {Array}
             */
            vm.histories = [];

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * List of users which is pre-filled based on the notes fetched from REST API
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
            vm.currentLimit = changesPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentOffset = 0;

            /**
             * default sorting
             * must be the same as in app/js/services/dynamicTableSettings/defaultTableStates.js
             */
            vm.orderBy = "date";
            vm.orderDir = 'asc';

            /**
             * filters for the request
             */
            vm.filters = {};

            /**
             * Flag to indicate loading status
             * @type {boolean}
             */
            vm.historyLoaded = true;

            /**
             * Get todays date at 00:00 for comparison
             */
            vm.today = new Date().setHours(0, 0, 0, 0);

            /**
             * Get yesterdays date at 00:00 for comparison
             *
             * 86400000 = 24 * 60 * 60 * 1000
             */
            vm.yesterday = new Date(vm.today - 86400000).setHours(0, 0, 0, 0);

            /**
             * save the string of the selected type
             * @type {string}
             */
            vm.filterSelectedType = undefined;

            /** get all model types */
            vm.modelTypes = WorkbenchElementsTranslationsService.contentTypeToModelName;
            vm.modelList = [];
            for (var key in vm.modelTypes) {
                if (vm.modelTypes.hasOwnProperty(key)) {
                    var value = vm.modelTypes[key];

                    vm.modelList.push({
                        'key': key,
                        'value': value,
                        'display': WorkbenchElementsTranslationsService.modelNameToTranslation[value]
                    });
                }
            }
            vm.modelList = $filter('orderBy')(vm.modelList, 'display');

            vm.historyDetailsVisible = {};

            /**
             * Load the complete and unfiltered dataset only if no filter is set which can be caused by navigating here
             * from the projects sidebar. Otherwise don't load the full dataset because the filter applied to the
             * search field will trigger the correct API call.
             */
            if (!$stateParams.filterProjects) {
                vm.getHistory(vm.currentLimit, vm.currentOffset);
            }
        };

        var expandColumn = {
            name: gettextCatalog.getString("Expand"),
            headerCellTemplate: '<div></div>',
            enableColumnMenu: false,
            enableHiding: false,
            field: 'changeset_type',
            cellTemplate: 'js/screens/history/expandableRowExpandTemplate.html'
        };

        var nameColumn = {
            name: gettextCatalog.getString("Name"),
            field: 'object',
            enableSorting: false,
            cellTemplate: '<div title="{{ COL_FIELD.display }}"><generic-link ' +
                'type="row.entity.object_type.model" ' +
                'object="row.entity.object"></generic-link>'
        };

        var typeColumn = {
            name: gettextCatalog.getString("Type"),
            field: 'object_type.model',
            enableSorting: false,
            cellTemplate: '<div><history-type-widget history="row.entity"></history-type-widget></div>'
        };

        var changeColumn = {
            name: gettextCatalog.getString("Change"),
            field: 'change_name',
            enableSorting: false,
            cellTemplate: '<div>{{ row.entity.change_name }}</div>'
        };

        var dateColumn = {
            name: gettextCatalog.getString("Date"),
            field: 'date',
            enableColumnMenu: false,
            cellTemplate: '<div>{{ row.entity.date | smallDateWithToday }}</div>',
            headerCellTemplate: 'js/screens/history/gridDateHeaderCell.html'
        };

        var userColumn = {
            name: gettextCatalog.getString("User"),
            field: 'user',
            enableSorting: false,
            cellTemplate: '<div><user-display-widget user="row.entity.user"></user-display-widget></div>'
        };

        vm.gridOptions = {
            enableSorting: true,
            appScopeProvider: vm,
            enableGridMenu: true,
            enablePaginationControls: false,
            enableColumnResizing: true,
            rowHeight: 30,
            enableExpandableRowHeader: false,
            showExpandAllButton: false,
            expandableRowTemplate: 'js/screens/history/expandableRowTemplate.html',
            expandableRowHeight: 250,
            columnDefs: [
                expandColumn,
                nameColumn,
                typeColumn,
                changeColumn,
                dateColumn,
                userColumn
            ]
        };

        /**
         * get base model for history element (function to show warnings)
         */
        vm.getBaseUrlModel = function (model) {
            var apiBaseModel = '';

            if (vm.baseUrlModels[model]) {
                apiBaseModel = vm.baseUrlModels[model];
            } else {
                console.warn('History api model is not defined:' + model)
            }

            return apiBaseModel;
        };

        /**
         * Query History
         */
        vm.getHistory = function (limit, offset, ignoreLoadingBar) {
            // query API with selected model filter only
            if (!vm.filterSelectedType) {
                return;
            }

            // if no limit is defined, use the default ``changesPerPage``
            if (limit === undefined) {
                limit = changesPerPage;
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

            if (vm.filterSelectedType) {
                vm.filters['model'] = vm.filterSelectedType;
            }

            // delete the filter if vm.filterSelectedType is empty
            if (vm.filters['model'] && !vm.filterSelectedType) {
                delete vm.filters['model'];
            }

            var projectPk = null;

            // check if a project filter is selected
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                projectPk = vm.selectedProjects[0];
            }

            vm.historyLoaded = false;

            // call REST API with the specified project and filters
            PaginatedHistoryRestServiceFactory('project', projectPk, ignoreLoadingBar).get(vm.filters).$promise.then(
                function success (response) {
                    vm.histories.length = 0;
                    for (var t = 0; t < response.results.length; t++) {
                        vm.histories.push(response.results[t]);
                    }

                    vm.numberOfChanges = response.count;

                    for (var i = 0; i < vm.histories.length; i++) {
                        // convert date string into dates
                        vm.histories[i].date = moment(vm.histories[i].date).toDate();
                        vm.histories[i].day = angular.copy(vm.histories[i].date).setHours(0, 0, 0, 0);
                    }

                    vm.gridOptions.data = vm.histories;
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load notes"));
                }
            ).finally(function () {
                vm.historyLoaded = true;
            });
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * changesPerPage;
            vm.currentLimit = changesPerPage;

            vm.getHistory(vm.currentLimit, vm.currentOffset);
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
            vm.getHistory(vm.currentLimit, vm.currentOffset, false);
        };

        vm.resetPaging = function () {
            vm.currentOffset = 0;
            vm.currentPage = 1;
        };

        $scope.$on("project-removed-from-filter-selection", function () {
            vm.selectedProjects = [];
            vm.resetPaging();
            vm.getHistory(vm.currentLimit, vm.currentOffset);
        });

        $scope.$watch("vm.selectedProjects", function () {
            vm.resetPaging();
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                vm.getHistory(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        vm.changeFilterType = function () {
            vm.resetPaging();
            vm.getHistory(vm.currentLimit, vm.currentOffset);
        };
    });
})();
