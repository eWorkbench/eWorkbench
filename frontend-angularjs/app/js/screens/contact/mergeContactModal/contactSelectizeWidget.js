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
    module.directive('mergeContactModalContactSelectizeWidget', function () {
        return {
            templateUrl: 'js/screens/contact/mergeContactModal/contactSelectizeWidget.html',
            controller: 'MergeContactModalContactSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                placeholder: "@",
                contacts: "=", // initial options
                maxItems: '=',
                selectedContactPk: '=?',
                loadedContacts: '=?',
                excludePks: '<?' // excluded elements will be filtered when loading data
            }
        }
    });

    module.controller('MergeContactModalContactSelectizeWidgetController', function (
        $scope,
        $sanitize,
        $timeout,
        ContactRestService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.filteredContacts = [];

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
                labelField: 'email',
                sortField: 'last_name',
                placeholder: vm.placeholder,
                searchField: ['email', 'first_name', 'last_name'],
                render: {
                    // formats the dropdown item
                    option: function (item, escape) {
                        return '<div>'
                            + '<span>' + vm.getFullName(item) + '</span></br>'
                            + '<span class="email-display">' + $sanitize(item.email) + '</span> '
                            + '</div>';
                    },
                    // formats the selected item
                    item: function (item, escape) {
                        // display title Firstname Lastname (username)
                        return '<div>'
                            + '<span>' + vm.getFullName(item) + '</span>'
                            + '&nbsp;'
                            + '<span class="email-display">' + $sanitize(item.email) + '</span></div>';
                    }
                },
                load: function (query, selectizeCallback) {
                    return vm.queryOnSearch(query, function (found) {
                        var contact = null,
                            notExcludedContacts = vm.filterExcluded(found);

                        // call the selectize callback => provide select options
                        selectizeCallback(notExcludedContacts);

                        // update and filter the loaded data and store the loaded contact data for future use
                        vm.filteredContacts.length = 0;
                        if (found && vm.loadedContacts !== undefined && vm.loadedContacts !== null) {
                            for (var i = 0; i < found.length; i++) {
                                contact = found[i];
                                vm.loadedContacts[contact.pk] = contact;

                                // add contact to filtered contacts only if it is not excluded
                                if (!vm.excludePks || vm.excludePks.indexOf(contact.pk) < 0) {
                                    vm.filteredContacts.push(contact);
                                }
                            }
                        }
                    });
                },
                onInitialize: function (selectize) {
                    vm.selectize = selectize;

                    // check for readonly (needs to be done in next digest cycle)
                    $timeout(function () {
                        if (vm.ngReadonly) {
                            selectize.lock();
                        }
                    });
                },
                onDropdownOpen: function () {
                    // Manually prevent dropdown from opening when there is no search term
                    if (!this.lastQuery || !this.lastQuery.length) {
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

        vm.getFullName = function (contact) {
            var title = $sanitize(contact.academic_title),
                firstName = $sanitize(contact.first_name),
                lastName = $sanitize(contact.last_name);

            return title + ' ' + firstName + ' ' + lastName;
        };

        /**
         * Calls querys to the API on search
         * @param query
         * @param callback
         */
        this.queryOnSearch = function (query, callback) {
            // check if query contains anything
            if (!query.length || query.length < 2) {
                // minimum of two characters before we fire a query to rest API
                return callback();
            }

            // query rest API - on success, we use callback with the response array
            return ContactRestService.resource.search({search: query}).$promise.then(
                function success (response) {
                    callback(response);
                },
                function error (rejection) {
                    console.log(rejection);
                    callback();
                }
            );
        };

        vm.filterExcluded = function (baseContactList) {
            if (!baseContactList || !vm.excludePks || vm.excludePks.length <= 0) {
                return baseContactList;
            }

            var contacts = [],
                contact = null;

            for (var i = 0; i < baseContactList.length; i++) {
                contact = baseContactList[i];
                if (vm.excludePks.indexOf(contact.pk) < 0) {
                    contacts.push(contact);
                }
            }

            return contacts;
        }

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

        // add data to filteredContacts, if it is not there yet (changed selectedContactPk from outside)
        $scope.$watch("vm.selectedContactPk", function (newValue, oldValue) {
            var pk = newValue,
                pkLoaded = false;

            if (!pk) {
                return;
            }

            for (var i = 0; i < vm.filteredContacts.length; i++) {
                var contact = vm.filteredContacts[i];

                if (contact.pk === pk) {
                    pkLoaded = true;
                    break;
                }
            }

            if (pkLoaded) {
                // all good, nothing to do
                return;
            }

            if (vm.loadedContacts && vm.loadedContacts.hasOwnProperty(pk)) {
                vm.filteredContacts.push(vm.loadedContacts[pk]);
            } else {
                // load from API
                ContactRestService.getCached({pk: pk}).$promise.then(
                    function success (response) {
                        if (!vm.loadedContacts) {
                            vm.loadedContacts = {};
                        }
                        vm.loadedContacts[response.pk] = response;
                        vm.filteredContacts.push(response);
                    }, function error (rejection) {
                        console.log(rejection);
                    });
            }
        }, true);
    });
})();
