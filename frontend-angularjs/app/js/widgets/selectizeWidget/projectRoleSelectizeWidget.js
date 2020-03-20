/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * Widget for selecting a project role
     */
    module.directive('projectRoleSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/projectRoleSelectizeWidget.html',
            controller: 'projectRoleSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                selectedProjectRole: '='
            }
        }
    });

    module.controller('projectRoleSelectizeWidgetController', function (
        $scope,
        $timeout,
        RolesRestService
    ) {
        'ngInject';

        var
            vm = this;

        vm.maxItems = 1;

        /**
         * a list of project roles
         * @type {Array}
         */
        vm.projectRoles = [];

        /**
         * Whether project roles have been loaded or not
         * @type {boolean}
         */
        vm.projectsRolesLoaded = false;

        // query project roles
        RolesRestService.queryCached().$promise.then(function success (response) {
            for (var i = 0; i < response.length; i++) {
                vm.projectRoles.push({
                    'pk': response[i].pk,
                    'name': response[i].name
                });
            }

            vm.projectsRolesLoaded = true;
        });

        vm.selectizeConfig = {
            plugins: {
                'on_enter_key': {

                }
            },
            create: false,
            nesting: true,
            valueField: 'pk',
            labelField: 'name',
            sortField: '-name',
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
