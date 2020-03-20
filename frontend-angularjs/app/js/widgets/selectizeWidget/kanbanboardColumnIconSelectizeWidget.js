/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');


    /**
     * Widget for selecting one taskPrioritys
     */
    module.directive('kanbanboardColumnIconSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/kanbanboardColumnIconSelectizeWidget.html',
            controller: 'KanbanboardColumnIconSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                selectedIcon: '='
            }
        }
    });

    /**
     * Controller for kanbanboardColumnIconSelectizeWidget
     *
     * Queries available icons from REST API
     */
    module.controller('KanbanboardColumnIconSelectizeWidgetController', function (
        $scope,
        $timeout,
        KanbanboardColumnIconService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.maxItems = 1;

            /**
             * List of available Icons (coming from REST API)
             */
            vm.icons = KanbanboardColumnIconService.getIcons();

            vm.selectizeConfig = {
                plugins: {
                    'on_enter_key': {}
                },
                create: false,
                nesting: true,
                valueField: 'value',
                labelField: 'display_name',
                sortField: 'display_name',
                placeholder: vm.placeholder,
                searchField: ['value', 'display_name'],
                render: {
                    //formats the dropdown item
                    option: function (item, escape) {
                        return '<div>'
                            + '<i class="' + escape(item.value) + '"></i> ' + escape(item.display_name)
                            + '</div>';
                    },
                    //formats the selected item
                    item: function (item, escape) {
                        return '<div>'
                            + '<i class="' + escape(item.value) + '"></i> ' + escape(item.display_name)
                            + '</div>';
                    }
                },
                onInitialize: function (selectize) {
                    // store selectize element
                    vm.selectize = selectize;

                    // check for readonly (needs to be done in next digest cycle)
                    $timeout(function () {
                        if (vm.ngReadonly) {
                            selectize.lock();
                        }
                    });

                    // activate plugin: on enter key press, emit an onSubmit event
                    selectize.on('enter', function () {
                        console.log('on enter');
                        $scope.$emit("selectize:onSubmit");
                    });
                },
                maxItems: vm.maxItems
            };
        };

        // watch ngReadonly and lock/unlock the selectize element (if it is already activated)
        $scope.$watch("vm.ngReadonly", function (newValue, oldValue) {
            if (vm.selectize) {
                if (newValue) {
                    vm.selectize.lock();
                } else {
                    vm.selectize.unlock();
                }
            }
        });
    });
})();
