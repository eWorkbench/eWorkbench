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
    module.directive('resourceSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/resourceSelectizeWidget.html',
            controller: 'ResourceSelectizeWidgetController',
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

    module.controller('ResourceSelectizeWidgetController', function (
        $scope,
        $timeout,
        ResourceSelectizeWidgetHelperService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.selectizeConfig = {
                plugins: {
                    'remove_button': {
                        mode: 'single'
                    },
                    // activate on enter key plugin
                    'on_enter_key': {}
                },
                create: false,
                nesting: true,
                // close the selectize dropdown after selecting
                closeAfterSelect: true,
                // let the user select an entry via using tab
                selectOnTab: true,
                valueField: 'pk',
                labelField: 'name',
                sortField: 'name',
                placeholder: vm.placeholder,
                searchField: ['name', 'description', 'location'],
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
                load: function (query, selectizeCallback) {
                    var extendedCallback = function (foundResources) {
                        var user = null;

                        // call given selectize callback
                        selectizeCallback(foundResources);

                        // populate vm.loadedResources with found data
                        if (foundResources && vm.loadedResources !== undefined && vm.loadedResources !== null) {
                            for (var i = 0; i < foundResources.length; i++) {
                                user = foundResources[i];
                                vm.loadedResources[user.pk] = user;
                            }
                        }
                    };

                    return ResourceSelectizeWidgetHelperService.queryOnSearch(vm, query, extendedCallback);
                },
                onInitialize: function (selectize) {
                    return ResourceSelectizeWidgetHelperService.init(vm, selectize);
                },
                onDropdownOpen: function () {
                    // Manually prevent dropdown from opening when there is no search term
                    if (!this.lastQuery.length) {
                        this.$dropdown.hide();
                    }
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
