/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Relation list as a table
     */
    module.directive('relationTableView', function () {
        return {
            restrict: 'E',
            controller: 'RelationTableViewController',
            templateUrl: 'js/widgets/relationListWidget/relationTableView.html',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                'relations': '=',
                'dateFilter': "=",
                'modelFilter': "=",
                // Sorting
                'orderBy': '=',
                'orderDir': '='
            }
        }
    });

    module.controller('RelationTableViewController', function (
        $scope,
        gettextCatalog,
        WorkbenchElementsTranslationsService,
        uiGridConstants,
        UserSortService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.initialRelations = vm.relations;

            var nameColumn = {
                name: gettextCatalog.getString("Relation Name"),
                field: 'table_object.display',
                enableSorting: false,
                displayName: gettextCatalog.getString("Relation Name"),
                cellTemplate: '<div class="ellipsis"><i class="{{ row.entity.table_object.content_type_icon }}" aria-hidden="true"></i>\n' +
                    '<generic-link type="row.entity.table_object.content_type_name" object="row.entity.table_object"></generic-link>' +
                    '</div>',
                visible: false
            };

            var typeColumn = {
                name: gettextCatalog.getString("Type"),
                field: 'left_content_object.content_type_model',
                enableSorting: false,
                cellTemplate: '<div>{{ row.entity.table_object.content_type_name_translated }}</div>'
            };

            var linkedByColumn = {
                name: gettextCatalog.getString("Linked by"),
                field: 'created_by',
                cellTemplate: '<div ng-if="row.entity.created_by">' +
                    '<user-display-widget user="row.entity.created_by"></user-display-widget></div>',
                sortingAlgorithm: UserSortService.sortAlgorithm
            };

            var linkedAtColumn = {
                name: gettextCatalog.getString("Linked at"),
                field: 'created_at',
                cellTemplate: '<div>{{ row.entity.created_at | smallDate }}</div>',
                type: "date"
            };

            var toolsColumn = {
                name: gettextCatalog.getString("Tools"),
                headerCellTemplate: '<div></div>',
                enableColumnMenu: false,
                enableSorting: false,
                enableHiding: false,
                cellTemplate: '<display-relation-functions-widget-table relation="row.entity"></display-relation-functions-widget-table>'
            };

            vm.gridOptions = {
                data: vm.relations,
                enableSorting: true,
                enableGridMenu: true,
                enableColumnResizing: true,
                rowHeight: 30,
                columnDefs: [
                    nameColumn,
                    typeColumn,
                    linkedByColumn,
                    linkedAtColumn,
                    toolsColumn
                ]
            };
        };

        vm.sortRelations = function () {
            var tmpRelations = [];

            if (vm.modelFilter != "") {
                for (var x = 0; x < vm.initialRelations.length; x++) {
                    if (vm.initialRelations[x]["table_object"]["content_type_model"] == vm.modelFilter) {
                        tmpRelations.push(vm.initialRelations[x]);
                    }
                }
            } else {
                tmpRelations = vm.relations;
            }

            if (vm.dateFilter == "-created_at") {
                tmpRelations.sort(function (a, b) {
                    return new Date(b.created_at) - new Date(a.created_at);
                });
            } else if (vm.dateFilter == "created_at") {
                tmpRelations.sort(function (a, b) {
                    return new Date(a.created_at) - new Date(b.created_at);
                });
            }

            vm.gridOptions["data"] = tmpRelations;
        };

        $scope.$watch("vm.dateFilter", function () {
            vm.sortRelations();
        });

        $scope.$watch("vm.modelFilter", function () {
            vm.sortRelations();
        });

        $scope.$watch("vm.relations", function () {
            vm.gridOptions.data = vm.relations;
        });
    });
})();
