/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * File list as a table
     */
    module.component('fileTableView', {
        templateUrl: 'js/screens/file/fileTableView.html',
        controller: 'FileTableViewController',
        controllerAs: 'vm',
        bindings: {
            'files': '<',
            // Sorting
            'orderBy': '=',
            'orderDir': '='
        }
    });

    /**
     * Controller for files as a table
     */
    module.controller('FileTableViewController', function (
        gettextCatalog,
        UserSortService
    ) {
        var vm = this;

        this.$onInit = function () {
            var titleColumn = {
                name: gettextCatalog.getString("Title"),
                field: 'title',
                cellTemplate: '<file-link file="row.entity" title="{{ row.entity.title }}">'
                    + '{{row.entity.title}}</file-link>'
            };

            var nameColumn = {
                name: gettextCatalog.getString("File Name"),
                field: 'name',
                cellTemplate: '<file-link file="row.entity" title="{{ row.entity.name }}">'
                    + '<i class="{{ row.entity.icon }} file-icon" style="font-size: 12pt"></i>'
                    + '{{row.entity.name}}'
                    + '</file-link>'
            };

            var fileSizeColumn = {
                name: gettextCatalog.getString("File size"),
                field: 'file_size',
                cellTemplate: '<div>{{ row.entity.file_size | bytes }}</div>'
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

            var mimeTypeColumn = {
                name: gettextCatalog.getString("Mime type"),
                field: 'mime_type',
                cellTemplate: '<div>{{ row.entity.mime_type }}</div>'
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
                data: vm.files,
                enableSorting: true,
                enableGridMenu: true,
                enableColumnResizing: true,
                rowHeight: 30,
                columnDefs: [
                    titleColumn,
                    nameColumn,
                    fileSizeColumn,
                    createdAtColumn,
                    createdByColumn,
                    mimeTypeColumn,
                    trashColumn
                ]
            };
        };
    });
})();
