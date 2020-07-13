/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * Widget for selecting one or many users
     */
    module.directive('userSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/userSelectizeWidget.html',
            controller: 'UserSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                // the input placeholder text
                placeholder: "@",
                // the maximum number of users than can be selected
                maxItems: '=',
                // the PKs of the selected users
                selectedUserPk: '=',
                // optional: will be populated with the users loaded while searching
                loadedUsers: '=?',
                // intial user options
                users: '=',
                // access search calendar pk (optional)
                accessUserPk: '=?',
                // access flag to search for editable permissions only
                accessEditable: '=?'
            }
        }
    });

    module.controller('UserSelectizeWidgetController', function (
        $scope,
        UserSelectizeWidgetHelperService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.loadedUsers = [];

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
                labelField: 'username',
                sortField: 'userprofile.last_name',
                placeholder: vm.placeholder,
                searchField: ['username', 'email', 'userprofile.first_name', 'userprofile.last_name'],
                render: {
                    //formats the dropdown item
                    option: function (user, escape) {
                        // render the html
                        return UserSelectizeWidgetHelperService.renderUser(user, escape);
                    },
                    //formats the selected item
                    item: function (user, escape) {
                        // render the html
                        return UserSelectizeWidgetHelperService.renderSelectedUser(user, escape);
                    }
                },
                load: function (query, selectizeCallback) {
                    var extendedCallback = function (foundUsers) {
                        var user = null;

                        // call given selectize callback
                        selectizeCallback(foundUsers);

                        // populate vm.loadedUsers with found data
                        if (foundUsers && vm.loadedUsers !== undefined && vm.loadedUsers !== null) {
                            for (var i = 0; i < foundUsers.length; i++) {
                                user = foundUsers[i];
                                vm.loadedUsers[user.pk] = user;
                            }
                        }
                    };

                    console.log("")

                    if (vm.accessUserPk) {
                        return UserSelectizeWidgetHelperService.queryAccessOnSearch(
                            vm, vm.accessUserPk, vm.accessEditable, query, extendedCallback);
                    }

                    return UserSelectizeWidgetHelperService.queryOnSearch(vm, query, extendedCallback);
                },
                onInitialize: function (selectize) {
                    return UserSelectizeWidgetHelperService.init(vm, selectize);
                },
                onDropdownOpen: function () {
                    // Manually prevent dropdown from opening when there is no search term
                    if (!this.lastQuery.length) {
                        this.$dropdown.hide();
                    }
                },
                onDelete: function () {
                    $scope.$emit("user-removed-from-filter-selection");
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

        // watch vm.placeholder and update it on change using updatePlaceholder()
        $scope.$watch("vm.placeholder", function (newValue, oldValue) {
            if (newValue != oldValue) {
                vm.selectize.settings.placeholder = vm.placeholder;
                vm.selectize.updatePlaceholder();
            }
        });

    });
})();
