/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * DSS Container list as a table
     */
    module.component('dsscontainerTableView', {
        templateUrl: 'js/screens/dsscontainer/dsscontainerTableView.html',
        controller: 'DSSContainerTableViewController',
        controllerAs: 'vm',
        bindings: {
            'dsscontainers': '<',
            // Sorting
            'orderBy': '=',
            'orderDir': '='
        }
    });

    module.controller('DSSContainerTableViewController', function (
        gettextCatalog,
        UserSortService
    ) {
        var vm = this;

        this.$onInit = function () {
            var nameColumn = {
                name: gettextCatalog.getString("Name"),
                field: 'name',
                cellTemplate: '<dsscontainer-link dsscontainer="row.entity" title="{{row.entity.name}}">'
                    + '{{ row.entity.name }}'
                    + '</dsscontainer-link>'
            };

            var pathColumn = {
                name: gettextCatalog.getString("Path"),
                field: 'path',
                enableSorting: true,
                cellTemplate: '<div>{{ row.entity.path }}</div>'
            };

            var readWriteSettingColumn = {
                name: gettextCatalog.getString("Read Write Setting"),
                field: 'read_write_setting',
                enableSorting: false,
                cellTemplate: '<div>'
                    + '<dsscontainer-settings-display-widget dss-container-r-w-setting="row.entity.read_write_setting">'
                    + '</dsscontainer-settings-display-widget>'
                    + '</div>'
            };

            var importOptionColumn = {
                name: gettextCatalog.getString("Import Option"),
                field: 'import_option',
                enableSorting: false,
                cellTemplate: '<div>'
                    + '<dsscontainer-settings-display-widget dss-container-import-option="row.entity.import_option">'
                    + '</dsscontainer-settings-display-widget>'
                    + '</div>'
            };

            var createdAtColumn = {
                name: gettextCatalog.getString("Created at"),
                field: 'created_at',
                cellTemplate: '<div>{{ row.entity.created_at | smallDate }}</div>'
            };

            var createdByColumn = {
                name: gettextCatalog.getString("Created by"),
                field: 'created_by',
                cellTemplate: '<div ng-if="row.entity.created_by">' +
                    '<user-display-widget user="row.entity.created_by"></user-display-widget></div>',
                sortingAlgorithm: UserSortService.sortAlgorithm
            };

            var lastModifiedAtColumn = {
                name: gettextCatalog.getString("Last updated at"),
                field: 'last_modified_at',
                cellTemplate: '<div>{{ row.entity.last_modified_at | smallDate }}</div>'
            };

            var lastModifiedByColumn = {
                name: gettextCatalog.getString("Last updated by"),
                field: 'last_modified_by',
                cellTemplate: '<div ng-if="row.entity.last_modified_by">' +
                    '<user-display-widget user="row.entity.last_modified_by"></user-display-widget></div>',
                sortingAlgorithm: UserSortService.sortAlgorithm
            };

            vm.gridOptions = {
                data: vm.dsscontainers,
                enableGridMenu: true,
                enableColumnResizing: true,
                enablePaginationControls: false,
                rowHeight: 30,
                columnDefs: [
                    nameColumn,
                    pathColumn,
                    readWriteSettingColumn,
                    importOptionColumn,
                    createdAtColumn,
                    createdByColumn,
                    lastModifiedAtColumn,
                    lastModifiedByColumn
                ]
            };
        };
    });
})();
