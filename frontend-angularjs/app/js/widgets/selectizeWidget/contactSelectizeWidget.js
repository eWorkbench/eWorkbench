/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Widget for selecting one or many contacts
     */
    module.directive('contactSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/contactSelectizeWidget.html',
            controller: 'ContactSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                contacts: "=",
                maxItems: '=',
                selectedContactPk: '='
            }
        }
    });

    module.controller('ContactSelectizeWidgetController', function (
        $scope,
        $timeout
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.selectizeConfig = {
                plugins: {
                    'remove_button': {
                        //mode: 'single'
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
                labelField: 'email',
                sortField: 'last_name',
                placeholder: vm.placeholder,
                searchField: ['email', 'first_name', 'last_name'],
                render: {
                    // formats the dropdown item
                    option: function (item, escape) {
                        return '<div>'
                            + '<span>' + escape(item.academic_title) + ' ' + escape(item.first_name) + ' ' + escape(item.last_name) + '</span></br>'
                            + '<span class="email-display">' + escape(item.email) + '</span> '
                            + '</div>';
                    },
                    // formats the selected item
                    item: function (item, escape) {
                        // display title Firstname Lastname (username)
                        return '<div>'
                            + '<span>' + escape(item.academic_title) + ' ' + escape(item.first_name) + ' ' + escape(item.last_name) + '</span> '
                            + '<span class="email-display">' + escape(item.email) + '</span></div>';
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
                        // submit the form in the next Digest Cycle (yay AngularJS)
                        $timeout(function () {
                            selectize.$input.closest("form").submit();
                        });
                    });
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
