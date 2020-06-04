/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.component('projectTableView', {
        templateUrl: 'js/screens/project/projectTableView.html',
        controller: 'ProjectTableViewController',
        controllerAs: 'vm',
        bindings: {
            'projects': '<',
            // Sorting
            'orderBy': '=',
            'orderDir': '='
        }
    });

    module.controller('ProjectTableViewController', function (
        $timeout,
        $element,
        $scope,
        toaster,
        gettext,
        gettextCatalog,
        uiGridConstants,
        ProjectRestService
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * Config: Height of row per entry in grid view
             * @type {number}
             * */
            vm.gridRowHeight = 30;

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
                field: 'name',
                cellTemplate: '<project-link project="row.entity"></project-link>',
                width: "*"
            };

            var progressColumn = {
                name: gettextCatalog.getString("Progress"),
                field: 'tasks_status',
                enableSorting: false,
                cellTemplate: '<task-status-display-widget task-status="row.entity.tasks_status">' +
                    '</task-status-display-widget>',
                width: "25%"
            };

            var startDateColumn = {
                name: gettextCatalog.getString("Start Date"),
                field: 'start_date',
                cellTemplate: '<div>{{ row.entity.start_date | smallDateWithoutTime }}</div>',
                width: "10%"
            };

            var stopDateColumn = {
                name: gettextCatalog.getString("Stop Date"),
                field: 'stop_date',
                cellTemplate: '<div>{{ row.entity.stop_date | smallDateWithoutTime }}</div>',
                width: "10%"
            };

            var projectStatusColumn = {
                name: gettextCatalog.getString("Done"),
                field: 'tasks_status_completed',
                enableSorting: false,
                cellTemplate: '<task-status-completed-widget task-status="row.entity.tasks_status">' +
                    '</task-status-completed-widget>',
                width: "10%"
            };

            var projectStateColumn = {
                name: gettextCatalog.getString("Status"),
                field: 'project_state',
                cellTemplate: '<project-state-widget project-state="row.entity.project_state">' +
                    '</project-state-widget>',
                width: "10%"
            };

            var trashColumn = {
                name: gettextCatalog.getString("Trash"),
                headerCellTemplate: '<div></div>',
                enableColumnMenu: false,
                enableSorting: false,
                enableHiding: false,
                cellTemplate: '<div class="text-center">'
                    + '<generic-delete-menu-widget model-object="row.entity">'
                    + '</generic-delete-menu-widget>'
                    + '</div>',
                width: 20
            };

            // columns for the root- and sub-grids
            vm.columnDefs = [
                expandColumn,
                nameColumn,
                progressColumn,
                startDateColumn,
                stopDateColumn,
                projectStatusColumn,
                projectStateColumn,
                trashColumn
            ];

            vm.gridOptions = {
                appScopeProvider: vm,
                enableGridMenu: true,
                enablePaginationControls: false,
                enableColumnResizing: false,
                enableColumnMoving: false,
                enableColumnHiding: false,
                enableColumnMenu: false,
                rowHeight: vm.gridRowHeight,
                enableExpandableRowHeader: false,
                showExpandAllButton: true,
                expandableRowTemplate: 'js/screens/project/expandableRowTemplate.html',
                columnDefs: vm.columnDefs
            };

            // must be passed as parameter to table-view-grid-expandable,
            // since onRegisterApi would be overwritten otherwise by the tableViewGrid controller
            vm.rootGridApi = null;
            vm.onRegisterApi = function (gridApi) {
                vm.rootGridApi = gridApi;

                // call the first API grid handler with tree level 1 (first sub-tree)
                vm.subGridHandler(gridApi, 1);
            };
        };

        /**
         * Handles the process of expanding a parent project with all its sub-projects
         */
        vm.subGridHandler = function (parentGridApi, gridTreeLevel) {
            parentGridApi.expandable.on.rowExpandedStateChanged($scope, function (row) {
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
                        columnDefs: vm.columnDefs,
                        showHeader: false,
                        onRegisterApi: function (subGridApi) {
                            // save reference to this API handler
                            var self = this;

                            // set scope variable for this API handler
                            self.gridTreeLevel = gridTreeLevel;

                            // call API handler for nested elements with increased grid tree level
                            vm.subGridHandler(subGridApi, ++self.gridTreeLevel);
                        }
                    };

                    ProjectRestService.query({
                        parent_project: row.entity.pk
                    }).$promise.then(
                        function success (response) {
                            row.entity.subGridOptions.data = response;
                            row.entity.subGridOptions.gridTreeLevel = gridTreeLevel;
                        },
                        function error (response) {
                            console.error(response);
                            toaster.pop('error', gettext("Could not load sub project"));
                        }
                    );
                }
            });
        };
    });
})();
