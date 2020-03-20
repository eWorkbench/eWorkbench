/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');


    module.directive('selectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/selectizeWidget.html',
            controller: 'SelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                placeholder: "@",
                items: "=",
                maxItems: '=',
                selectedUserPk: '='
            }
        }
    });

    module.controller('SelectizeWidgetController', function () {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.selectizeConfig = {
                plugins: {
                    'remove_button': {
                        mode: 'single'
                    }
                },
                valueField: 'pk',
                labelField: 'username',
                sortField: 'username',
                placeholder: vm.placeholder,
                searchField: ['username', 'email', 'first_name', 'last_name'],

                onInitialize: function (selectize) {
                    // receives the selectize object as an argument
                },
                maxItems: vm.maxItems
            };
        };
    });
})();
