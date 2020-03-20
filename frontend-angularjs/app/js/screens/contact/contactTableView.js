/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Contact list as a table
     */
    module.component('contactTableView', {
        templateUrl: 'js/screens/contact/contactTableView.html',
        controller: 'ContactTableViewController',
        controllerAs: 'vm',
        bindings: {
            'contacts': '<',
            // Sorting
            'orderBy': '=',
            'orderDir': '='
        }
    });

    /**
     * Controller for contacts as a table
     */
    module.controller('ContactTableViewController', function (
        gettextCatalog,
        uiGridConstants
    ) {
        var vm = this;

        this.$onInit = function () {
            var firstNameColumn = {
                name: gettextCatalog.getString("Firstname"),
                field: 'first_name',
                cellTemplate: '<contact-link contact="row.entity"' +
                    ' title="{{ row.entity.first_name }} {{ row.entity.last_name }}">'
                    + '{{ row.entity.first_name }}'
                    + '</contact-link>'
            };

            var lastNameColumn = {
                name: gettextCatalog.getString("Lastname"),
                field: 'last_name',
                cellTemplate: '<contact-link contact="row.entity"' +
                    ' title="{{ row.entity.first_name }} {{ row.entity.last_name }}">'
                    + '{{ row.entity.last_name }}'
                    + '</contact-link>'
            };

            var eMailColumn = {
                name: gettextCatalog.getString("E-Mail"),
                field: 'email',
                cellTemplate: '<div title="{{ row.entity.email }}">{{ row.entity.email }}</div>'
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
                    '<user-display-widget user="row.entity.created_by"></user-display-widget></div>'
            };

            var academicTitleColumn = {
                name: gettextCatalog.getString("Academic title"),
                field: 'academic_title',
                cellTemplate: '<div>{{ row.entity.academic_title }}</div>'
            };
            var phoneColumn = {
                name: gettextCatalog.getString("Phone"),
                field: 'phone',
                cellTemplate: '<div title="{{ row.entity.phone }}">{{ row.entity.phone }}</div>'
            };

            var companyColumn = {
                name: gettextCatalog.getString("Company"),
                field: 'company',
                cellTemplate: '<div title="{{ row.entity.company }}">{{ row.entity.company }}</div>'
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
                data: vm.contacts,
                enableSorting: true,
                enableGridMenu: true,
                enableColumnResizing: true,
                rowHeight: 30,
                columnDefs: [
                    firstNameColumn,
                    lastNameColumn,
                    eMailColumn,
                    createdAtColumn,
                    createdByColumn,
                    academicTitleColumn,
                    phoneColumn,
                    companyColumn,
                    trashColumn
                ]
            };
        };
    });
})();
