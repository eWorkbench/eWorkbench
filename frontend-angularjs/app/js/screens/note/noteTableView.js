/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Note List as cards
     */
    module.component('noteTableView', {
        templateUrl: 'js/screens/note/noteTableView.html',
        controller: 'NoteTableViewController',
        controllerAs: 'vm',
        bindings: {
            'notes': '<',
            // Sorting
            'orderBy': '=',
            'orderDir': '='
        }
    });

    /**
     * Controller for note list as cards
     */
    module.controller('NoteTableViewController', function (
        gettextCatalog,
        UserSortService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            var subjectColumn = {
                name: gettextCatalog.getString("Subject"),
                field: 'subject',
                cellTemplate: '<note-link note="row.entity" title="{{row.entity.subject}}">'
                    + '</note-link>'
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
                data: vm.notes,
                enableSorting: true,
                enableGridMenu: true,
                enableColumnResizing: true,
                rowHeight: 30,
                columnDefs: [
                    subjectColumn,
                    createdAtColumn,
                    createdByColumn,
                    trashColumn
                ]
            };
        };
    });
})();
