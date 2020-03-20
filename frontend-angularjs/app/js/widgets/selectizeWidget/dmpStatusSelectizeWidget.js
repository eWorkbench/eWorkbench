/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Widget for selecting one dmp status
     */
    module.directive('dmpStatusSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/dmpStatusSelectizeWidget.html',
            controller: 'DmpStatusSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                selectedDmpStatus: '='
            }
        }
    });

    module.controller('DmpStatusSelectizeWidgetController', function (
        $scope,
        $timeout,
        DmpStateService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * States of the DMP
             * @type {object}
             */
            vm.dmpStates = [];

            for (var key in DmpStateService.dmpStates) {
                if (DmpStateService.dmpStates.hasOwnProperty(key)) {
                    vm.dmpStates.push({'key': key, 'name': DmpStateService.dmpStates[key]});
                }
            }

            vm.maxItems = 1;

            vm.selectizeConfig = {
                plugins: {
                    'on_enter_key': {}
                },
                create: false,
                nesting: true,
                valueField: 'key',
                labelField: 'name',
                placeholder: vm.placeholder,
                searchField: ['name'],
                render: {
                    //formats the dropdown item
                    option: function (item, escape) {
                        return '<div>'
                            + escape(item.name)
                            + '</div>';
                    },
                    //formats the selected item
                    item: function (item, escape) {
                        return '<div>'
                            + escape(item.name)
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
