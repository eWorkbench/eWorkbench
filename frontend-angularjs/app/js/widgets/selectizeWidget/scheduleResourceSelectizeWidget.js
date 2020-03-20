/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');


    /**
     * Widget for selecting one or many resources
     */
    module.directive('scheduleResourceSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/scheduleResourceSelectizeWidget.html',
            controller: 'ScheduleResourceSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                resources: "=",
                maxItems: '=',
                selectedResourcePk: '='
            }
        }
    });

    module.controller('ScheduleResourceSelectizeWidgetController', function (
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
                searchField: ['name', 'description', 'location'],
                render: {
                    // formats the dropdown item
                    option: function (item, escape) {
                        var str = '<div>';

                        if (item.location && item.location != '') {
                            str += '<span>' + escape(item.name) + ' (' + escape(item.location) + ')</span></br>';
                        } else {
                            str += '<span>' + escape(item.name) + '</span></br>';
                        }

                        if (item.availability) {
                            str += '<span class="availability-display">' + escape(item.availability) + '</span><br />';
                        }
                        str += '<span class="description-display">' + escape(item.description) + '</span> '
                            + '</div>';

                        return str;
                    },
                    // formats the selected item
                    item: function (item, escape) {
                        if (item.location && item.location != '') {
                            return '<div>'
                                + '<span>' + escape(item.name) + ' (' + escape(item.location) + ')</span>'
                                + '</div>';
                        }

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
