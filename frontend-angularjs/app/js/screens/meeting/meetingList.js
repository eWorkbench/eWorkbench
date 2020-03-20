/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Component for displaying and filtering a Meeting List
     */
    module.component('meetingList', {
        templateUrl: 'js/screens/meeting/meetingList.html',
        controller: 'MeetingListController',
        controllerAs: 'vm',
        bindings: {}
    });

    /**
     * Meeting List Controller
     *
     * Displays a Meeting List and provides filters
     */
    module.controller('MeetingListController', function (
        $timeout,
        $scope,
        $stateParams,
        $compile,
        $state,
        $q,
        gettextCatalog,
        CalendarConfigurationService,
        DynamicTableSettingsService,
        MeetingRestService,
        uiCalendarConfig,
        toaster,
        PaginationCountHeader
    ) {
        'ngInject';

        var
            vm = this,
            /**
             * Config: Number of tasks displayed per page
             * @type {number}
             * */
            meetingsPerPage = 20;


        this.$onInit = function () {
            /**
             * Current View (list or card)
             * @type {string}
             */
            vm.currentView = 'list';

            /**
             * A list of Meetings
             * @type {Array}
             */
            vm.meetings = [];

            /**
             * the currently selected project for filter
             */
            vm.selectedProjects = undefined;

            /**
             * save the string of the search input
             * @type {string}
             */
            vm.searchField = undefined;

            /**
             * List of users which is pre-filled based on the meetings fetched from REST API
             * @type {Array}
             */
            vm.users = [];

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentLimit = meetingsPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentOffset = 0;

            /**
             * default sorting
             */
            vm.defaultOrderBy = "date_time_start";
            vm.defaultOrderDir = "desc";
            vm.orderBy = vm.defaultOrderBy;
            vm.orderDir = vm.defaultOrderDir;

            var sortOptions = DynamicTableSettingsService.getColumnSortingAndMatchNameToField('grid_state_meetings');

            if (sortOptions['sortField']) {
                vm.orderBy = sortOptions['sortField'];
            }

            if (sortOptions['sortDir']) {
                vm.orderDir = sortOptions['sortDir'];
            }

            /**
             * filters for the request
             */
            vm.filters = {};

            /**
             * Whether or not meetings have finished loading
             * @type {boolean}
             */
            vm.meetingsLoaded = false;

            /**
             * Load the complete and unfiltered dataset only if no filter is set which can be caused by navigating here
             * from the projects sidebar. Otherwise don't load the full dataset because the filter applied to the
             * search field will trigger the correct API call.
             */
            if (!$stateParams.filterProjects) {
                vm.getMeetings(vm.currentLimit, vm.currentOffset);
            }
        };

        //is triggered when the meeting was deleted, trashed or restored (genericDeleteMenu.js)
        $scope.$on('objectDeletedEvent', function () {
            vm.getMeetings(vm.currentLimit, vm.currentOffset);
        });
        $scope.$on('objectTrashedEvent', function () {
            // check if this was the last element on this page and change to the actual last page
            if (vm.meetings.length === 1) {
                vm.currentPage -= 1;
                vm.currentOffset -= meetingsPerPage;
            }

            vm.getMeetings(vm.currentLimit, vm.currentOffset);
        });
        $scope.$on('objectRestoredEvent', function () {
            vm.getMeetings(vm.currentLimit, vm.currentOffset);
        });

        /**
         * Query Meetings from REST API
         */
        vm.getMeetings = function (limit, offset) {
            // if no limit is defined, use the default ``changesPerPage``
            if (limit === undefined) {
                limit = meetingsPerPage;
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

            if (vm.orderBy && vm.orderDir) {
                vm.filters['ordering'] = (vm.orderDir === 'asc' ? '' : '-') + vm.orderBy;
            } else {
                vm.filters['ordering'] = null;
            }

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
                vm.filters['attending_users'] = vm.selectedUsers;
            }

            // delete the filter if vm.selectedUsers is empty
            if (vm.filters['attending_users'] && vm.selectedUsers.length === 0) {
                delete vm.filters['attending_users'];
            }

            // delete the search filter if vm.searchField is empty
            if (vm.filters['search'] === "") {
                delete vm.filters['search'];
            }

            return MeetingRestService.query(vm.filters).$promise.then(
                function success (response) {
                    vm.meetings.length = 0;
                    for (var t = 0; t < response.length; t++) {
                        vm.meetings.push(response[t]);
                    }

                    vm.numberOfMeetings = response.$httpHeaders(PaginationCountHeader.getHeaderName());

                    for (var i = 0; i < response.length; i++) {
                        var meeting = response[i];

                        // collect users that created a meeting
                        vm.users.push(meeting.created_by);
                    }
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load meetings"));
                }
            ).finally(function () {
                vm.meetingsLoaded = true;
            });
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * meetingsPerPage;
            vm.currentLimit = meetingsPerPage;

            vm.getMeetings(vm.currentLimit, vm.currentOffset);
        };

        vm.resetPaging = function () {
            vm.currentOffset = 0;
            vm.currentPage = 1;
        };

        $scope.$on("project-removed-from-filter-selection", function () {
            vm.selectedProjects = [];
            vm.resetPaging();
            vm.getMeetings(vm.currentLimit, vm.currentOffset);
        });

        $scope.$on("user-removed-from-filter-selection", function () {
            vm.selectedUsers = [];
            vm.resetPaging();
            vm.getMeetings(vm.currentLimit, vm.currentOffset);
        });

        $scope.$watch("vm.selectedProjects", function () {
            vm.resetPaging();
            if (vm.selectedProjects && vm.selectedProjects.length > 0) {
                vm.getMeetings(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.selectedUsers", function () {
            vm.resetPaging();
            if (vm.selectedUsers && vm.selectedUsers.length > 0) {
                vm.getMeetings(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("vm.searchField", function () {
            if (vm.searchField !== undefined && (vm.searchField.length >= 3 || vm.searchField.length === 0)) {
                vm.filters['search'] = vm.searchField.toLowerCase();
                vm.resetPaging();
                vm.getMeetings(vm.currentLimit, vm.currentOffset);
            }
        }, true);

        $scope.$watch("[vm.orderBy, vm.orderDir]", function (newValue, oldValue) {
            /**
             *  When the user changes the column-ordering, vm.gridApi.core.on.sortChanged() in tableViewGrid
             *  is triggered, which then modifies vm.orderBy and vm.orderDir. This change is detected here
             *  and get<Element>() is executed with the ordering-filter using the new values of orderBy/orderDir
            */
            if ((newValue[0] === null) && (oldValue[0] !== vm.defaultOrderBy)) {
                // triggered when the sorting is reset (i.e. when newValue[0] is null),
                // defaultOrderBy/defaultOrderDir is applied to the order-filter.
                // Only applies when the change didn't occur from the default to null (e.g. on page-loading)
                vm.orderBy = vm.defaultOrderBy;
                vm.orderDir = vm.defaultOrderDir;
                vm.getMeetings(vm.currentLimit, vm.currentOffset);
            }
            if ((newValue !== oldValue) && (vm.orderBy !== null)) {
                // triggered when sorting by column or direction has changed (But not on sort-reset)
                vm.getMeetings(vm.currentLimit, vm.currentOffset);
            }
        }, true);
    });
})();
