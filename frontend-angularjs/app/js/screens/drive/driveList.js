/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Component for displaying and filtering a Drive List
     */
    module.component('driveList', {
        templateUrl: 'js/screens/drive/driveList.html',
        controller: 'DriveListController',
        controllerAs: 'vm',
        bindings: {}
    });

    /**
     * Drive List Controller
     *
     * Displays a Drive List and provides filters
     */
    module.controller('DriveListController', function (
        $scope,
        $stateParams,
        $q,
        $timeout,
        AuthRestService,
        IconImagesService,
        DriveRestService,
        DSSContainerRestService,
        gettextCatalog,
        toaster,
        PaginationCountHeader
    ) {
        'ngInject';

        var
            vm = this,
            /**
             * Config: Number of drives displayed per page
             * @type {number}
             * */
            drivesPerPage = 10;

        this.$onInit = function () {
            /**
             * Current Contact List View Type (list or card)
             * @type {string}
             */
            vm.currentView = 'list';

            /**
             * A list of Drives (fetched from REST API)
             * @type {Array}
             */
            vm.drives = [];

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * List of users which is pre-filled based on the drives fetched from REST API
             * @type {Array}
             */
            vm.users = [];

            /**
             * List of DSS Containers
             * @type {Array}
             */
            vm.dssContainers = [];

            /**
             * save the string of the search input
             * @type {string}
             */
            vm.searchField = undefined;

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentLimit = drivesPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentOffset = 0;

            /**
             * filters for the request
             */
            vm.filters = {};

            /**
             * whether the drive data has been loaded
             * @type {boolean}
             */
            vm.drivesLoaded = false;

            /**
             * Load the complete and unfiltered dataset only if no filter is set which can be caused by navigating here
             * from the projects sidebar. Otherwise don't load the full dataset because the filter applied to the
             * search field will trigger the correct API call.
             */
            if (!$stateParams.filterProjects) {
                vm.getDrives(vm.currentLimit, vm.currentOffset);
            }
        };

        //is triggered when the drive was deleted, trashed or restored (genericDeleteMenu.js)
        $scope.$on('objectDeletedEvent', function () {
            vm.getDrives(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on('objectTrashedEvent', function () {
            // check if this was the last element on this page and change to the actual last page
            if (vm.drives.length === 1) {
                vm.currentPage -= 1;
                vm.currentOffset -= drivesPerPage;
            }

            vm.getDrives(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on('objectRestoredEvent', function () {
            vm.getDrives(vm.currentLimit, vm.currentOffset);
        });

        /**
         * Get all available DSS containers to fill the filter
         */
        DSSContainerRestService.query().$promise.then(
            function success (response) {
                // store DSS containers
                vm.dssContainers = response;
            },
            function error (rejection) {
                console.log(rejection);
                toaster.pop('error', gettextCatalog.getString("Error"),
                    gettextCatalog.getString("Failed to query DSS containers"));
            }
        );

        /**
         * Query Drives
         */
        vm.getDrives = function (limit, offset) {
            // if no limit is defined, use the default ``changesPerPage``
            if (limit === undefined) {
                limit = drivesPerPage;
            }
            // if no offset is defined, begin at 0
            if (offset === undefined) {
                offset = 0;
            }

            /**
             * Defines the filters for the REST API for recent changes
             * @type {{limit: *, offset: *, model: (undefined|*)}}
             */
            vm.filters['limit'] = limit;
            vm.filters['offset'] = offset;

            // check if a project filter is selected
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                vm.filters['projects_recursive'] = vm.selectedProjects[0];
            }

            // delete the filter if vm.selectedProjects is empty
            if (vm.filters['projects_recursive'] && vm.selectedProjects.length === 0) {
                delete vm.filters['projects_recursive'];
            }

            // check if a user filter is selected
            if (vm.selectedUsers && vm.selectedUsers.length > 0) {
                vm.filters['created_by'] = vm.selectedUsers;
            }

            // delete the filter if vm.selectedUsers is empty
            if (vm.filters['created_by'] && vm.selectedUsers.length === 0) {
                delete vm.filters['created_by'];
            }

            // check if a dss container filter is selected
            if (vm.selectedDSSContainer && vm.selectedDSSContainer.length > 0) {
                vm.filters['container'] = vm.selectedDSSContainer;
            }

            // delete the filter if vm.selectedDSSContainer is empty
            if (vm.filters['container'] && vm.selectedDSSContainer.length === 0) {
                delete vm.filters['container'];
            }

            // delete the search filter if vm.searchField is empty
            if (vm.filters['search'] === "") {
                delete vm.filters['search'];
            }

            return DriveRestService.query(vm.filters).$promise.then(
                function success (response) {
                    vm.drives.length = 0;
                    for (var t = 0; t < response.length; t++) {
                        vm.drives.push(response[t]);
                    }

                    vm.numberOfDrives = response.$httpHeaders(PaginationCountHeader.getHeaderName()) || 0;

                    // iterate over vm.drives and collect users so we can provide an initial selection of users
                    for (var i = 0; i < vm.drives.length; i++) {
                        vm.users.push(vm.drives[i].created_by);
                    }
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load drives"));
                }
            ).finally(function () {
                vm.drivesLoaded = true;
            });
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * drivesPerPage;
            vm.currentLimit = drivesPerPage;

            vm.getDrives(vm.currentLimit, vm.currentOffset);
        };

        vm.resetPaging = function () {
            vm.currentOffset = 0;
            vm.currentPage = 1;
        };

        $scope.$on("project-removed-from-filter-selection", function () {
            vm.selectedProjects = [];
            vm.resetPaging();
            vm.getDrives(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on("user-removed-from-filter-selection", function () {
            vm.selectedUsers = [];
            vm.resetPaging();
            vm.getDrives(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on("dsscontainer-removed-from-filter-selection", function () {
            vm.selectedDSSContainer = [];
            vm.resetPaging();
            vm.getDrives(vm.currentLimit, vm.currentOffset);
        });

        $scope.$watch("vm.selectedProjects", function () {
            vm.resetPaging();
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                vm.getDrives(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.selectedUsers", function () {
            vm.resetPaging();
            if (vm.selectedUsers && vm.selectedUsers.length > 0) {
                vm.getDrives(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.selectedDSSContainer", function () {
            vm.resetPaging();
            if (vm.selectedDSSContainer && vm.selectedDSSContainer.length > 0) {
                vm.getDrives(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.searchField", function () {
            if (vm.searchField !== undefined && (vm.searchField.length >= 3 || vm.searchField.length === 0)) {
                vm.filters['search'] = vm.searchField.toLowerCase();
                vm.resetPaging();
                vm.getDrives(vm.currentLimit, vm.currentOffset);
            }
        }, true);
    });
})();
