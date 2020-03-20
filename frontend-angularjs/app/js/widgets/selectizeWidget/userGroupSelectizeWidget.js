/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Widget for selecting one or many users
     */
    module.directive('userGroupSelectizeWidget', function () {
        return {
            templateUrl: 'js/widgets/selectizeWidget/userGroupSelectizeWidget.html',
            controller: 'UserGroupSelectizeWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                ngReadonly: "=",
                // the input placeholder text
                placeholder: "@",
                // the maximum number of users than can be selected
                maxItems: '=',
                // the names of the selected usergroups
                selectedUserGroupPk: '=',
                // optional: will be populated with the usergroups loaded while searching
                loadedUserGroups: '=?',
                // intial user group options
                userGroups: '='
            }
        };
    });

    module.controller('UserGroupSelectizeWidgetController', function (
        $scope,
        UserGroupRestService,
        gettextCatalog,
        $timeout
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.loadedUserGroups = [];

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
                selectOnTab: true,
                valueField: 'pk',
                labelField: 'name',
                sortField: 'name',
                placeholder: vm.placeholder,
                searchField: ['name'],
                render: {
                    //formats the dropdown item
                    option: function (userGroup) {
                        // render the html
                        return vm.renderUserGroup(userGroup);
                    },
                    //formats the selected item
                    item: function (userGroup) {
                        // render the html
                        return vm.renderSelectedUserGroup(userGroup);
                    }
                },
                load: function (query, selectizeCallback) {
                    var extendedCallback = function (foundUserGroups) {
                        var userGroup = null;

                        // call given selectize callback
                        selectizeCallback(foundUserGroups);

                        // populate vm.loadedUsers with found data
                        if (foundUserGroups && vm.loadedUserGroups !== undefined && vm.loadedUserGroups !== null) {
                            for (var i = 0; i < foundUserGroups.length; i++) {
                                userGroup = foundUserGroups[i];
                                vm.loadedUserGroups[userGroup.pk] = userGroup;
                            }
                        }
                    };

                    return vm.queryOnSearch(query, extendedCallback);
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
                        // submit the form in the next Digest Cycle (yay AngularJS)
                        $timeout(function () {
                            selectize.$input.closest("form").submit();
                        });
                    });
                },
                maxItems: vm.maxItems
            };

            /**
             * Query user groups rest service, and when this is finished, initialize the watcher
             */
            UserGroupRestService.queryCached().$promise.then(
                function success (response) {

                    var userGroupsResponse = response;

                    return UserGroupRestService.queryCachedDict().then(
                        function success (response) {
                            vm.userGroups = userGroupsResponse;
                            vm.userGroupsDict = response;

                            var userGroupPk = null,
                                userGroup = null,
                                selectedUserGroupsPksList = null;

                            if (!vm.selectedUserGroupsPks) {
                                return;
                            }

                            if (typeof vm.selectedUserGroupsPks === 'string') {
                                selectedUserGroupsPksList = [vm.selectedUserGroupsPks];
                            } else {
                                selectedUserGroupsPksList = vm.selectedUserGroupsPks;
                            }

                            // verify that all selectedUserGroupsPks are available
                            for (var i = 0; i < selectedUserGroupsPksList.length; i++) {
                                userGroupPk = vm.selectedUserGroupsPks[i];

                                if (!vm.userGroupsDict[userGroupPk]) {
                                    // not available, create a "fake" user group
                                    userGroup = {
                                        pk: userGroupPk,
                                        name: gettextCatalog.getString("Unknown User Group"),
                                        unknownUserGroup: true
                                    };

                                    vm.userGroups.push(userGroup);
                                    vm.userGroupsDict[userGroupPk] = userGroup;
                                }
                            }
                        }
                    );
                }
            );
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

        /**
         * Returns the rendered html for the user group options in the user group selectize widgets
         * @param userGroup
         */
        this.renderUserGroup = function (userGroup) {
            var html = '<div class="row"><div class="col-xs-12"><span>';

            html += userGroup.name;
            html += '</span></div></div>';

            return html;
        };

        /**
         * Returns the rendered html for the selected user group in the user group selectize widgets
         * @param userGroup
         */
        this.renderSelectedUserGroup = function (userGroup) {
            var html = '<div><span>';

            html += userGroup.name;
            html += '</span></div>';

            return html;
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
            return this.searchUserGroupViaRest(query).$promise.then(
                function success (response) {
                    callback(response);
                },
                function error (rejection) {
                    console.log("Error querying usergroup search endpoint");
                    console.log(rejection);
                    callback();
                }
            );
        };

        /**
         * Querys the API
         * @param searchValue
         */
        this.searchUserGroupViaRest = function (searchValue) {
            return UserGroupRestService.resource.search({search: searchValue});
        };

    });
})();
