/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Picture List as cards
     */
    module.component('pictureTableView', {
        templateUrl: 'js/screens/picture/pictureTableView.html',
        controller: 'PictureTableViewController',
        controllerAs: 'vm',
        bindings: {
            'pictures': '<',
            // Sorting
            'orderBy': '=',
            'orderDir': '='
        }
    });

    /**
     * Controller for picture list as cards
     */
    module.controller('PictureTableViewController', function (
        gettextCatalog,
        UserSortService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            var titleColumn = {
                name: gettextCatalog.getString("Title"),
                field: 'title',
                cellTemplate: '<picture-link picture="row.entity" title="{{ row.entity.title }}">'
                    + '</picture-link>'
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

            var heightColumn = {
                name: gettextCatalog.getString("Height"),
                field: 'height',
                cellTemplate: '<div>{{ row.entity.height }}</div>'
            };

            var widthColumn = {
                name: gettextCatalog.getString("Width"),
                field: 'width',
                cellTemplate: '<div>{{ row.entity.width }}</div>'
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
                data: vm.pictures,
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
                    heightColumn,
                    widthColumn,
                    trashColumn
                ]
            };
        };
    });
})();
