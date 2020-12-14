/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * Widget for selecting a DSS container
     */
    module.directive('dssContainerSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/dssContainerSelectizeWidget.html',
            controller: 'DSSContainerSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                // the input placeholder text
                placeholder: "@",
                // the maximum number of DSS containers than can be selected
                maxItems: '=',
                // the PKs of the selected DSS containers
                selectedDSSContainerPk: '=',
                // intial DSS containers
                dssContainers: '='
            }
        }
    });

    module.controller('DSSContainerSelectizeWidgetController', function (
        $scope,
        $timeout
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {

            vm.selectizeConfig = {
                plugins: {
                    'on_enter_key': {}
                },
                valueField: 'pk',
                labelField: 'name',
                sortField: 'name',
                placeholder: vm.placeholder,
                searchField: ['name'],
                render: {
                    // formats the dropdown item
                    option: function (item, escape) {
                        var str = '<div>';

                        str += '<span>' + escape(item.name) + '</span></br>';
                        str += '</div>';

                        return str;
                    },
                    // formats the selected item
                    item: function (item, escape) {
                        return '<div>'
                            + '<span>' + escape(item.name) + '</span>'
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
                        $scope.$emit("selectize:onSubmit");
                    });
                },
                onDelete: function () {
                    $scope.$emit("dsscontainer-removed-from-filter-selection");
                },
                onType: function (str) {
                    // Close drop down when no search is typed.
                    if (str === "") {
                        this.$dropdown.hide();
                    } else {
                        // make sure to show it again
                        this.$dropdown.show();
                    }
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