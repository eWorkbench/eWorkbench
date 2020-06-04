/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('screenHeaderFunctionBar', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/screenHeaderFunctionBar/screenHeaderFunctionBar.html',
            controller: 'ScreenHeaderFunctionBarController',
            scope: {
                currentView: '=',
                searchField: '=?',
                selectedProjects: '=?',
                selectedUsers: '=?',
                screenTitle: '@', // string
                screenNewEntity: '@', // string
                screenNewEntityType: '@',
                showSearchField: '<?', // bool
                showUserField: '<?', // bool
                showProjectField: '<?', // bool
                showAddNewButton: '<?', // bool
                showDisplayDeletedButton: '<?', // bool
                showViewField: '<?', // bool
                users: '=?',
                cardViewTitle: '@',
                listViewTitle: '@' // string
            },
            transclude: {
                'screenTitle': '?screenTitle',
                'additionalFilter': '?additionalFilter',
                'additionalButtons': '?additionalButtons'
            },
            controllerAs: 'vm',
            bindToController: true
        }
    });

    module.directive('resourcesScreenHeaderFunctionBar', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/screenHeaderFunctionBar/resourcesScreenHeaderFunctionBar.html',
            controller: 'ScreenHeaderFunctionBarController',
            scope: {
                currentView: '=',
                searchField: '=',
                selectedUsers: '=',
                selectedProjects: '=',
                selectedAvailabilityStart: '<?',
                selectedAvailabilityStop: '<?',
                screenTitle: '@', // string
                screenNewEntity: '@', // string
                screenNewEntityType: '@',
                showSearchField: '<?', // bool
                showUserField: '<?', // bool
                showProjectField: '<?', // bool
                showAddNewButton: '<?', // bool
                showDisplayDeletedButton: '<?', // bool
                maxItems: '<?', // string, optional
                users: '=?',
                cardViewTitle: '@',
                listViewTitle: '@' // string
            },
            transclude: {
                'screenTitle': '?screenTitle',
                'additionalFilter': '?additionalFilter'
            },
            controllerAs: 'vm',
            bindToController: true
        }
    });

    module.controller('ScreenHeaderFunctionBarController', function (
        $injector,
        $scope,
        $state,
        $stateParams,
        $timeout,
        AuthRestService,
        ProjectRestService,
        FilterUrlStateService,
        WorkbenchElementsTranslationsService,
        responsiveBreakpoints,
        gettextCatalog,
        toaster,
        displayTrashedItemsWidget,
        UserNameService,
        GenericModelService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            /**
             * Default setting for currentView
             * @type {string}
             */
            if (!vm.currentView) {
                vm.currentView = 'list';
            }

            /**
             * Default setting for display deleted button
             * @type {bool}
             */
            if (typeof vm.showDisplayDeletedButton == 'undefined') {
                vm.showDisplayDeletedButton = true;
            }

            /**
             * Default setting for user selection field
             * @type {bool}
             */
            if (typeof vm.showUserField == 'undefined') {
                vm.showUserField = true;
            }

            /**
             * Default setting for search field
             * @type {bool}
             */
            if (typeof vm.showSearchField == 'undefined') {
                vm.showSearchField = true;
            }

            /**
             * Default setting for view fields
             * @type {bool}
             */
            if (typeof vm.showViewField == 'undefined') {
                vm.showViewField = true;
            }

            /**
             * Default setting for resource creator field
             * @type {bool}
             */
            if (typeof vm.showCreatorField == 'undefined') {
                vm.showCreatorField = true;
            }

            /**
             * Default setting for resource availability field
             * @type {bool}
             */
            if (typeof vm.showAvailabilityField == 'undefined') {
                vm.showAvailabilityField = true;
            }
            /**
             * Default setting for project slection field
             * @type {bool}
             */
            if (typeof vm.showProjectField == 'undefined') {
                vm.showProjectField = true;
            }

            /**
             * Default setting for for the add new item button
             * @type {bool}
             */
            if (typeof vm.showAddNewButton == 'undefined') {
                vm.showAddNewButton = true;
            }

            /**
             * Default setting for the max items in the user selectize
             * @type {string}
             */
            if (typeof vm.maxItems == 'undefined') {
                vm.maxItems = "1";
            }

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * If "showOnlyMyElements" is set as a query parameter, we select the current user
             */
            if ($stateParams.showOnlyMyElements) {
                vm.selectedUsers = vm.currentUser.pk;
            }

            /**
             * If "filterProjects" is set as a query parameter, we select the filtered project
             * and fetch the project tree from the backend
             */
            if ($stateParams.filterProjects) {
                vm.selectedProjects = [$stateParams.filterProjects];
            } else {
                // since there's no query parameter, we return an empty option list
                vm.selectedProjects = [];
            }
        };

        var decodeFilterOptionsFromCurrentState = function () {
            if ($state.params) {
                if ($state.params["filterSearchField"]) {
                    vm.searchField = $state.params["filterSearchField"];
                }
                if ($state.params["filterProjects"]) {
                    if (Array.isArray($state.params["filterProjects"])) {
                        vm.selectedProjects = $state.params["filterProjects"];
                    } else {
                        // is object
                        vm.selectedProjects = [$state.params["filterProjects"]];
                    }
                }
                if ($state.params["filterSelectedUsers"]) {
                    vm.selectedUsers = $state.params['filterSelectedUsers'];
                }
            } else {
                console.error("Current state params are not available...");
            }
        };

        /**
         * Encodes the filter options to the url of the current $state
         */
        var encodeFilterOptionsToCurrentStateUrl = function () {
            if (!vm.selectedUsers || vm.selectedUsers.length === 0) {
                // unset filterSelectedUsers
                FilterUrlStateService.setFilterOption('filterSelectedUsers', undefined);
            } else {
                FilterUrlStateService.setFilterOption('filterSelectedUsers', vm.selectedUsers);
            }

            if (!vm.selectedProjects || vm.selectedProjects.length === 0) {
                // unset filterProjects
                FilterUrlStateService.setFilterOption('filterProjects', undefined);
            } else {
                // only store the top project
                FilterUrlStateService.setFilterOption('filterProjects', vm.selectedProjects[0]);
            }

            if (!vm.searchField || vm.searchField === "") {
                // unset searchField
                FilterUrlStateService.setFilterOption('filterSearchField', undefined);
            } else {
                FilterUrlStateService.setFilterOption('filterSearchField', vm.searchField);
            }
        };

        var registerDecodeFilterOptions = function () {
            decodeFilterOptionsFromCurrentState();

            $scope.$watchGroup(['vm.selectedProjects', 'vm.selectedUsers', 'vm.searchField'], function (a, b) {
                encodeFilterOptionsToCurrentStateUrl();
            });
        };

        registerDecodeFilterOptions();

        /**
         * Watch responsive breakpoints for XS screens and force to card view
         */
        $scope.$watch(function () {
            return responsiveBreakpoints['xs']
        }, function (newVal, oldVal) {
            if (newVal == true) {
                console.log("XS Screen detected, forcing to view");
                vm.currentView = 'card';
            }
        });

        /**
         * Open a modal dialog that shows the trashed items
         */
        vm.showTrashedItems = function () {
            displayTrashedItemsWidget.open(vm.screenNewEntityType);
        };

        /**
         * save the searchString for filtering
         * @param searchString
         */
        vm.doSearch = function (searchString) {
            vm.searchField = searchString;
        };

        vm.cancelSearch = function () {
            vm.searchField = "";
            console.log("cancel search");
        };

        /**
         * add a user pk to vm.selectedUsers
         * @param selectedUserPk
         */
        vm.addToSelectedUsersList = function (selectedUserPk) {
            if (vm.selectedUsers.indexOf(selectedUserPk) === -1) {
                vm.selectedUsers.push(parseInt(selectedUserPk, 10));
            }
        };

        /**
         * remove a user pk to vm.selectedUsers
         * @param selectedUserPk
         */
        vm.removeFromSelectedUsersList = function (selectedUserPk) {
            vm.selectedUsers = vm.selectedUsers.filter(function (e) {
                return e !== selectedUserPk;
            });
        };

        /**
         * remove a user pk to vm.selectedUsersCheckboxList and vm.selectedUsers
         * @param selectedUserPk
         */
        vm.removeSelectedUsersCheckboxList = function (selectedUserPk) {
            vm.selectedUsersCheckboxList = vm.selectedUsersCheckboxList.filter(function (e) {
                return e !== selectedUserPk;
            });
            vm.removeFromSelectedUsersList(selectedUserPk);
        };

        /**
         * checks if to remove or add a user when the checkbox is changed
         * @param selectedUserPk
         */
        vm.checkClick = function (selectedUserPk) {
            if (vm.selectedCheckbox[selectedUserPk] == false) {
                vm.removeFromSelectedUsersList(selectedUserPk);
            } else {
                vm.addToSelectedUsersList(selectedUserPk);
            }
        };

        /**
         * get a username by the pk
         * @param selectedUserPk
         */
        vm.getUserByPk = function (selectedUserPk) {
            var user = null;

            for (var i = 0; i < vm.users.length; i++) {
                if (vm.users[i].pk == selectedUserPk) {
                    user = vm.users[i];
                    break;
                }
            }

            if (user) {
                return UserNameService.getFullNameOrUsername(user);
            }

            console.error("In screenheaderFunctionBar: User could not be found in vm.getUserByPk()");

            return '';
        };

        /**
         * Opens modal dialogs for creating a new entity based on "vm.screenNewEntityType"
         *
         * On successful create of an entity, the detail view of this entity is shown (by using $state.go)
         */
        vm.createNewEntity = function () {
            var modalService = GenericModelService.getCreateModalServiceByModelName(vm.screenNewEntityType);

            if (modalService) {
                // create a modal and wait for a result
                var modal = modalService.open();

                modal.result.then(
                    modalService.viewElement
                ).catch(
                    function () {
                        console.log("Modal canceled");
                    }
                );
            }
        };

        $scope.$watch("vm.cardViewTitle", function () {
            if (!vm.cardViewTitle) {
                vm.cardViewTitle = gettextCatalog.getString("Card View");
            }
        });

        $scope.$watch("vm.listViewTitle", function () {
            if (!vm.listViewTitle) {
                vm.listViewTitle = gettextCatalog.getString("List View");
            }
        });
    });
})();
