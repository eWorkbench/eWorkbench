/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('scheduleScreenHeaderFunctionBar', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/screenHeaderFunctionBar/scheduleScreenHeaderFunctionBar.html',
            controller: 'ScheduleScreenHeaderFunctionBarController',
            scope: {
                currentView: '=',
                searchField: '=',
                selectedProjects: '=',
                selectedUsers: '=',
                loadedResources: "=",
                selectedResources: "=",
                screenTitle: '@', // string
                screenNewEntity: '@', // string
                screenNewEntityType: '@',
                showAddNewButton: '<?', // bool
                showDisplayDeletedButton: '<?', // bool
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

    module.controller('ScheduleScreenHeaderFunctionBarController', function (
        $injector,
        $rootScope,
        $scope,
        $state,
        $stateParams,
        $timeout,
        $uibModal,
        AuthRestService,
        FilterUrlStateService,
        WorkbenchElementsTranslationsService,
        MeetingRestService,
        ResourceRestService,
        ResourceHelperService,
        responsiveBreakpoints,
        gettextCatalog,
        toaster,
        displayTrashedItemsWidget,
        GenericModelService,
        CalendarAccessPrivilegeRestService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.loadedUserData = [];
            vm.userSelectizeSelectedPks = [];
            vm.userSeletizeUsers = [];
            vm.checkboxUsers = [];
            vm.checkboxUsers = [];
            vm.checkboxSelectedUsers = [];
            vm.resourceSelectizeSelectedPks = [];
            vm.loadedResources = [];
            vm.checkboxSelectedResources = [];

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
             * Default setting for for the add new item button
             * @type {bool}
             */
            if (typeof vm.showAddNewButton == 'undefined') {
                vm.showAddNewButton = true;
            }

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * A list of projects
             * @type {Array}
             */
            vm.projects = null;

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

            // reset vm.calendarAccessPrivilege
            vm.calendarAccessPrivilege = null;

            vm.userPlaceholderDefault = gettextCatalog.getString('Display appointments of ...');
            vm.userPlaceholderHover = gettextCatalog.getString('Search user who gave me access');
            vm.userPlaceholder = vm.userPlaceholderDefault;

            vm.resourcePlaceholderDefault = gettextCatalog.getString('Display resource bookings ...');
            vm.resourcePlaceholderHover = gettextCatalog.getString('Search resource');
            vm.resourcePlaceholder = vm.resourcePlaceholderDefault;
        };

        vm.changeUserPlaceholderToHover = function () {
            vm.userPlaceholder = vm.userPlaceholderHover;
        };

        vm.changeUserPlaceholderToDefault = function () {
            vm.userPlaceholder = vm.userPlaceholderDefault;
        };

        vm.changeResourcePlaceholderToHover = function () {
            vm.resourcePlaceholder = vm.resourcePlaceholderHover;
        };

        vm.changeResourcePlaceholderToDefault = function () {
            vm.resourcePlaceholder = vm.resourcePlaceholderDefault;
        };

        vm.getCalendarAccessPrivileges = function () {
            // if we already have vm.calendarAccessPrivilege we don't need to query the API again
            if (vm.calendarAccessPrivilege) {
                return vm.showPrivileges();
            }

            // if vm.calendarAccessPrivilege isn't set we need to query and show the modal on success
            return CalendarAccessPrivilegeRestService.query().$promise.then(
                function success (response) {
                    // there should only be one result per user
                    vm.calendarAccessPrivilege = response[0];
                    // now we can open the modal
                    vm.showPrivileges();
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to query privileges"));
                    console.log(rejection);
                }
            )
        };

        /**
         * Opens modal dialog for privileges
         */
        vm.showPrivileges = function () {
            var modalInstance = $uibModal.open({
                templateUrl: 'js/screens/objectPrivileges/objectPrivilegesModalView.html',
                controller: 'ObjectPrivilegesModalViewController',
                controllerAs: 'vm',
                bindToController: true,
                resolve: {
                    baseUrlModel: function () {
                        return "calendar-access-privileges";
                    },
                    baseModel: function () {
                        return vm.calendarAccessPrivilege;
                    }
                }
            });

            modalInstance.result.then(function (result) {
                console.log("modal closed with result", result);
            }).catch(function (reason) {
                console.log("Modal dismissed with reason", reason);
            });
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

        // checks if the user was already added to the user-checkbox-list-widget
        vm.checkboxUsersContainsUser = function (loadedUser) {
            var result = false;

            for (var i = 0; i < vm.checkboxUsers.length; i++) {
                if (vm.checkboxUsers[i].pk === loadedUser.pk) {
                    result = true;
                }
            }

            return result;
        };

        /**
         * Take new user out of the user-selectize element and put them into the user-checkbox-list-widget.
         */
        $scope.$watch("vm.userSelectizeSelectedPks", function () {
            if (vm.userSelectizeSelectedPks) {
                var loadedUserPk = vm.userSelectizeSelectedPks,
                    loadedUser = vm.loadedUserData[loadedUserPk];

                if (loadedUser && !vm.checkboxUsersContainsUser(loadedUser)) {
                    vm.checkboxUsers.push(loadedUser);
                    vm.userSelectizeSelectedPks = null;
                }
            }
        });

        /**
         * Take new resource out of the resource-selectize element and put them into the resource-checkbox-list-widget.
         */
        $scope.$watch("vm.resource_pk", function () {
            if (vm.resource_pk) {
                var loadedResource = {};

                for (var i = 0; i < vm.loadedResources.length; i++) {
                    if (vm.loadedResources[i].pk == vm.resource_pk) {
                        loadedResource = vm.loadedResources[i];
                        break;
                    }
                }

                if (loadedResource) {
                    loadedResource.color = ResourceHelperService.selectColor(vm.checkboxSelectedResources.length);
                    vm.checkboxSelectedResources.push(loadedResource);
                    vm.resource_pk = null;
                }
            }
        });

        /**
         * Update vm.selectedUsers for changes from user-checkbox-list-widget.
         */
        $scope.$watchCollection("vm.checkboxSelectedUsers", function () {
            var i = null,
                user = null;

            vm.selectedUsers = [];
            for (i = 0; i < vm.checkboxSelectedUsers.length; i++) {
                user = vm.checkboxSelectedUsers[i];

                // user pks are required as string
                vm.selectedUsers.push(String(user.pk));
            }
        });

        /**
         * Update vm.selectedResources for changes from resource-checkbox-list-widget.
         */
        $scope.$watchCollection("vm.checkboxSelectedResources", function () {
            var i = null,
                resource = null;

            vm.selectedResources = [];
            for (i = 0; i < vm.checkboxSelectedResources.length; i++) {
                resource = vm.checkboxSelectedResources[i];

                vm.selectedResources.push(resource);
            }
        });

        // remove the resource filters
        $rootScope.$on("schedule:removeSelectedResources", function () {
            vm.checkboxSelectedResources = [];
        });
    });
})();
