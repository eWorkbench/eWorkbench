/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Resource list as a table
     */
    module.component('resourceTableView', {
        templateUrl: 'js/screens/resource/resourceTableView.html',
        controller: 'ResourceTableViewController',
        controllerAs: 'vm',
        bindings: {
            'resources': '<',
            // Sorting
            'orderBy': '=',
            'orderDir': '='
        }
    });

    /**
     * Controller for resources as a table
     */
    module.controller('ResourceTableViewController', function (
        gettextCatalog,
        UserSortService
    ) {
        var vm = this;

        this.$onInit = function () {
            var nameColumn = {
                name: gettextCatalog.getString("Name"),
                field: 'name',
                cellTemplate: '<resource-link resource="row.entity" title="{{row.entity.name}}">'
                    + '{{ row.entity.name }}'
                    + '</resource-link>'
            };

            var typeColumn = {
                name: gettextCatalog.getString("Type"),
                field: 'type',
                cellTemplate: '<resource-type-widget resource-type="row.entity.type"></resource-type-widget>'
            };

            var descriptionColumn = {
                name: gettextCatalog.getString("Description"),
                field: 'description',
                cellTemplate: '<div><span ng-bind-html="row.entity.description | htmlToPlaintext"></span></div>'
            };

            var locationColumn = {
                name: gettextCatalog.getString("Location"),
                field: 'location',
                cellTemplate: '<div title="{{row.entity.location}}">{{row.entity.location}}</div>'
            };

            var createdByColumn = {
                name: gettextCatalog.getString("Created by"),
                field: 'created_by',
                cellTemplate: '<div ng-if="row.entity.created_by">' +
                    '<user-display-widget user="row.entity.created_by"></user-display-widget></div>',
                sortingAlgorithm: UserSortService.sortAlgorithm
            };

            var contactColumn = {
                name: gettextCatalog.getString("Contact"),
                field: 'contact',
                cellTemplate: '<div>{{row.entity.contact}}</div>'
            };

            var responsibleUnitColumn = {
                name: gettextCatalog.getString("Responsible unit"),
                field: 'responsible_unit',
                cellTemplate: '<div>{{row.entity.responsible_unit}}</div>'
            };

            var userAvailabilityColumn = {
                name: gettextCatalog.getString("User availability"),
                field: 'user_availability',
                cellTemplate: '<div><resource-user-availability-widget ' +
                    'resource-user-availability="row.entity.user_availability">' +
                    '</resource-user-availability-widget></div>'
            };

            var duplicateColumn = {
                name: gettextCatalog.getString("Duplicate"),
                headerCellTemplate: '<div></div>',
                enableColumnMenu: false,
                enableSorting: false,
                enableHiding: true,
                cellTemplate: '<div class="text-center"><generic-duplicate-menu-widget ' +
                    'model-object="row.entity" ' +
                    'base-model="row.entity" ' +
                    'base-url-model="resources"> ' +
                    '</generic-duplicate-menu-widget></div>'
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


            var bookColumn = {
                name: gettextCatalog.getString("Book"),
                headerCellTemplate: '<div></div>',
                enableColumnMenu: false,
                enableSorting: false,
                enableHiding: false,
                cellTemplate: '<div class="text-center">' +
                    '<resource-book-widget resource="row.entity" title="Book">' +
                    '</resource-book-widget></div>'
            };

            vm.gridOptions = {
                data: vm.resources,
                enableSorting: true,
                enableGridMenu: true,
                enablePaginationControls: false,
                enableColumnResizing: true,
                rowHeight: 30,
                columnDefs: [
                    nameColumn,
                    typeColumn,
                    descriptionColumn,
                    locationColumn,
                    createdByColumn,
                    contactColumn,
                    responsibleUnitColumn,
                    userAvailabilityColumn,
                    duplicateColumn,
                    trashColumn,
                    bookColumn
                ]
            };
        };
    });
})();
