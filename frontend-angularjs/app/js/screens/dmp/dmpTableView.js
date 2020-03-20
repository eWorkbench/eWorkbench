/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * DMP list as a table
     */
    module.component('dmpTableView', {
        templateUrl: 'js/screens/dmp/dmpTableView.html',
        controller: 'DMPTableViewController',
        controllerAs: 'vm',
        bindings: {
            'dmps': '<',
            // Sorting
            'orderBy': '=',
            'orderDir': '='
        }
    });

    /**
     * Controller for dmps as a table
     */
    module.controller('DMPTableViewController', function (
        DmpStateService,
        gettextCatalog,
        UserSortService
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * Dictionary with DMP states
             * @type {*}
             */
            vm.dmpStates = DmpStateService.dmpStates;

            var titleColumn = {
                name: gettextCatalog.getString("Title"),
                field: 'title',
                cellTemplate: '<dmp-link dmp="row.entity" title="{{row.entity.title}}">'
                    + '</dmp-link>'
            };

            var dmpTemplateColumn = {
                name: gettextCatalog.getString("DMP Template"),
                field: 'dmp_form',
                cellTemplate: '<div>{{ row.entity.dmp_form_title }}</div>'
            };

            var statusColumn = {
                name: gettextCatalog.getString("Status"),
                field: 'status',
                cellTemplate: '<div><dmp-status-widget dmp-status="row.entity.status"></dmp-status-widget></div>'
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

            var trashColumn = {
                name: gettextCatalog.getString("Trash"),
                headerCellTemplate: '<div></div>',
                enableColumnMenu: false,
                enableSorting: false,
                enableHiding: false,
                cellTemplate: '<div class="text-center"><generic-delete-menu-widget model-object="row.entity">' +
                    '</generic-delete-menu-widget></div>'
            };

            vm.gridOptions = {
                data: vm.dmps,
                enableSorting: true,
                enableGridMenu: true,
                enableColumnResizing: true,
                rowHeight: 30,
                columnDefs: [
                    titleColumn,
                    dmpTemplateColumn,
                    statusColumn,
                    createdAtColumn,
                    createdByColumn,
                    lastModifiedAtColumn,
                    lastModifiedByColumn,
                    trashColumn
                ]
            };
        };
    });
})();
