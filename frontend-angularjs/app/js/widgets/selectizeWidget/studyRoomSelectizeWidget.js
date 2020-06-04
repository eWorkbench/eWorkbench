/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');


    /**
     * Widget for selecting one resourceTypes
     */
    module.directive('studyRoomSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/studyRoomSelectizeWidget.html',
            controller: 'StudyRoomSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                resources: "=",
                selectedResourcePk: '='
            }
        };
    });

    module.controller('StudyRoomSelectizeWidgetController', function (
        $scope,
        $timeout,
        ResourceSelectizeWidgetHelperService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.maxItems = 1;

            vm.selectizeConfig = {
                plugins: {
                    'on_enter_key': {}
                },
                create: false,
                nesting: true,
                valueField: 'pk',
                labelField: 'name',
                sortField: 'name',
                placeholder: vm.placeholder,
                searchField: ['name'],
                render: {
                    // formats the dropdown item
                    option: function (item, escape) {
                        // render the html
                        return ResourceSelectizeWidgetHelperService.renderResource(item, escape);
                    },
                    // formats the selected item
                    item: function (item, escape) {
                        // render the html
                        return ResourceSelectizeWidgetHelperService.renderSelectedResource(item, escape);
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
