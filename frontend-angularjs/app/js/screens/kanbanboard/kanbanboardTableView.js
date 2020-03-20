/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Kanbanboard list as a table
     */
    module.component('kanbanboardTableView', {
        templateUrl: 'js/screens/kanbanboard/kanbanboardTableView.html',
        controller: 'KanbanboardTableViewController',
        controllerAs: 'vm',
        bindings: {
            'kanbanboards': '<',
            // Sorting
            'orderBy': '=',
            'orderDir': '='
        }
    });

    /**
     * Controller for kanbanboards as a table
     */
    module.controller('KanbanboardTableViewController', function (
        gettextCatalog,
        UserSortService
    ) {
        var vm = this;

        this.$onInit = function () {
            var titleColumn = {
                name: gettextCatalog.getString("Title"),
                field: 'title',
                cellTemplate: '<kanbanboard-link kanbanboard="row.entity" '
                    + 'title="{{ row.entity.title }}">'
                    + '{{ row.entity.title }}'
                    + '</kanbanboard-link>'
            };

            var createdAtColumn = {
                name: gettextCatalog.getString("Created at"),
                field: 'created_at',
                cellTemplate: '<div>{{ row.entity.created_at | smallDate}}</div>'
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
                cellTemplate: '<div>{{ row.entity.last_modified_at | smallDate}}</div>'
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
                data: vm.kanbanboards,
                enableSorting: true,
                enableGridMenu: true,
                enableColumnResizing: true,
                rowHeight: 30,
                columnDefs: [
                    titleColumn,
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
