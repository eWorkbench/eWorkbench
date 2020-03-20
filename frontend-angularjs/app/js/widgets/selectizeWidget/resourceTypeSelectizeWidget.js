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
    module.directive('resourceTypeSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/resourceTypeSelectizeWidget.html',
            controller: 'ResourceTypeSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                selectedResourceType: '='
            }
        };
    });

    module.controller('ResourceTypeSelectizeWidgetController', function (
        $scope,
        $timeout,
        ResourceConverterService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.maxItems = 1;
            vm.resourceTypes = [];

            for (var resourceType in ResourceConverterService.resourceTypeTexts) {
                if (ResourceConverterService.resourceTypeTexts.hasOwnProperty(resourceType)) {
                    vm.resourceTypes.push({
                        'pk': resourceType,
                        'title': ResourceConverterService.resourceTypeTexts[resourceType],
                        'icon': ResourceConverterService.resourceTypeImages[resourceType],
                        'order': ResourceConverterService.resourceTypeOrder[resourceType]
                    });
                }
            }

            vm.selectizeConfig = {
                plugins: {
                    'on_enter_key': {}
                },
                create: false,
                nesting: true,
                valueField: 'pk',
                labelField: 'title',
                sortField: '-order',
                placeholder: vm.placeholder,
                searchField: ['title'],
                render: {
                    //formats the dropdown item
                    option: function (item, escape) {
                        return '<div>'
                            + '<i class="' + escape(item.icon) + '"></i> ' + escape(item.title)
                            + '</div>';
                    },
                    //formats the selected item
                    item: function (item, escape) {
                        return '<div>'
                            + '<i class="' + escape(item.icon) + '"></i> ' + escape(item.title)
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
