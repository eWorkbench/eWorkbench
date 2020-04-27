/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Resource list as a table
     */
    module.component('myBookingsTableView', {
        templateUrl: 'js/screens/resource/myBookingsTableView.html',
        controller: 'MyBookingsTableViewController',
        controllerAs: 'vm',
        bindings: {
            'key': '@',
            'resource': '=?'
        }
    });

    /**
     * Controller for resources as a table
     */
    module.controller('MyBookingsTableViewController', function (
        $scope,
        $window,
        $rootScope,
        gettextCatalog,
        uiGridConstants,
        toaster,
        MyResourceBookingsRestService,
        confirmDialogWidget,
        IconImagesService,
        UiSettingsService,
        ResourceBookingCreateEditModalService,
        NavigationService,
        UserSortService,
        MyResourceBookingsRestServiceExport,
        DynamicTableSettingsService,
        FileSaver,
        PaginationCountHeader
    ) {
        var
            vm = this,
            /**
             * Config: Number of resourceBookings displayed per page
             * @type {number}
             * */
            resourceBookingsPerPage = 10;


        this.$onInit = function () {
            vm.icons = IconImagesService.mainActionIcons;
            vm.resourceBookingsLoaded = false;
            vm.hidePastBookingsKey = "hide_past_bookings";
            vm.hidePastBookings = UiSettingsService.getSaved(vm.hidePastBookingsKey) || false;

            // returns true if the date_time_end is before now
            vm.bookingIsInThePast = function (row) {
                var now = moment();

                return row.entity.date_time_end.isBefore(now);
            };

            var resourceNameColumn = {
                name: gettextCatalog.getString("Resource Name"),
                field: 'resource__name',
                cellTemplate: '<div ng-class="{\'past-resource-booking\': grid.appScope.bookingIsInThePast(row)}">' +
                    '<a ng-if="!grid.appScope.bookingIsInThePast(row)" ng-click="grid.appScope.editBooking(row.entity)" ' +
                    'title="{{ \'Edit Booking\'| translate}}">{{row.entity.resource.name}}</a>' +
                    '<span ng-if="grid.appScope.bookingIsInThePast(row)">{{row.entity.resource.name}}</span></div>'
            };

            var resourceTypeColumn = {
                name: gettextCatalog.getString("Resource Type"),
                field: 'resource__type',
                cellTemplate: '<div ng-class="{\'past-resource-booking\': grid.appScope.bookingIsInThePast(row)}">' +
                    '<resource-type-widget resource-type="row.entity.resource.type">' +
                    '</resource-type-widget></div>'
            };

            var resourceDescriptionColumn = {
                name: gettextCatalog.getString("Resource Description"),
                field: 'resource__description',
                cellTemplate: '<div ng-class="{\'past-resource-booking\': grid.appScope.bookingIsInThePast(row)}" ' +
                    'title="{{row.entity.resource.description}}">{{row.entity.resource.description}}' +
                    '</div>'
            };

            var resourceLocationColumn = {
                name: gettextCatalog.getString("Resource Location"),
                field: 'resource__location',
                cellTemplate: '<div ng-class="{\'past-resource-booking\': grid.appScope.bookingIsInThePast(row)}" ' +
                    'title="{{row.entity.resource.location}}">{{row.entity.resource.location}}</div>'
            };

            var meetingNameColumn = {
                name: gettextCatalog.getString("Meeting"),
                field: 'meeting__title',
                cellTemplate: '<div ng-class="{\'past-resource-booking\': grid.appScope.bookingIsInThePast(row)}" ' +
                    'title="{{row.entity.meeting.title}}">' +
                    '<a ng-click="grid.appScope.goToMeeting(row.entity.meeting)">{{row.entity.meeting.title}}</a>' +
                    '</div>'
            };

            var meetingAttendingUsersColumn = {
                name: gettextCatalog.getString("Meeting attending users"),
                field: 'meeting__attending_users',
                cellTemplate: '<div ng-class="{\'past-resource-booking\': grid.appScope.bookingIsInThePast(row)}">' +
                    '<meeting-attending-users-cell-widget meeting="row.entity.meeting">' +
                    '</meeting-attending-users-cell-widget></div>'
            };

            var bookedStartTimeColumn = {
                name: gettextCatalog.getString("Booked From"),
                field: 'date_time_start',
                cellTemplate: '<div ng-class="{\'past-resource-booking\': grid.appScope.bookingIsInThePast(row)}">' +
                    '{{ row.entity.date_time_start | smallDate}}</div>'
            };

            var bookedEndTimeColumn = {
                name: gettextCatalog.getString("Booked To"),
                field: 'date_time_end',
                cellTemplate: '<div ng-class="{\'past-resource-booking\': grid.appScope.bookingIsInThePast(row)}">' +
                    '{{ row.entity.date_time_end | smallDate}}</div>'
            };

            var commentColumn = {
                name: gettextCatalog.getString("Description"),
                field: 'comment',
                cellTemplate: '<div ng-class="{\'past-resource-booking\': grid.appScope.bookingIsInThePast(row)}">' +
                    '{{ row.entity.comment }}</div>'
            };

            var createdByColumn = {
                name: gettextCatalog.getString("Booked by"),
                field: 'created_by',
                cellTemplate: '<div ng-if="row.entity.created_by">' +
                    '<user-display-widget user="row.entity.created_by"></user-display-widget></div>',
                sortingAlgorithm: UserSortService.sortAlgorithm
            };

            var createdAtColumn = {
                name: gettextCatalog.getString("Booked at"),
                field: 'created_at',
                cellTemplate: '<div>{{ row.entity.created_at | smallDate }}</div>'
            };

            var exportColumn = {
                name: gettextCatalog.getString("Export"),
                headerCellTemplate: '<div></div>',
                enableColumnMenu: false,
                enableSorting: false,
                enableHiding: true,
                cellTemplate: '<div class="text-center">' +
                    '<a role="button" ng-click="grid.appScope.exportResourceBooking(row.entity)" ' +
                    'title="{{ \'Export\'| translate}}">' +
                    '<i class="{{:: grid.appScope.icons.export }}" aria-hidden="true"></i></a>' +
                    '</div>'
            };

            var deleteColumn = {
                name: gettextCatalog.getString("Trash"),
                headerCellTemplate: '<div></div>',
                enableColumnMenu: false,
                enableSorting: false,
                enableHiding: false,
                cellTemplate: '<div ng-if="!grid.appScope.bookingIsInThePast(row)" class="text-center">' +
                    '<a role="button" ng-click="grid.appScope.deleteResourceBooking(row.entity)" ' +
                    'title="{{ \'Delete\'| translate}}">' +
                    '<i class="{{:: grid.appScope.icons.delete }}" aria-hidden="true"></i></a>' +
                    '</div>'
            };

            var rebookColumn = {
                name: gettextCatalog.getString("Rebook"),
                headerCellTemplate: '<div></div>',
                enableColumnMenu: false,
                enableSorting: false,
                enableHiding: false,
                cellTemplate: '<div class="text-center"><div style="display: inline-block">' +
                    '<a role="button" class="btn btn-default btn-sm" ng-click="grid.appScope.rebookResource(row.entity)" ' +
                    'title="{{ \'Rebook\'| translate}}" translate>Rebook</a></div></div>'
            };

            vm.gridOptions = {
                data: vm.resourceBookings,
                enableSorting: true,
                enableGridMenu: true,
                enablePaginationControls: false,
                enableColumnResizing: true,
                rowHeight: 30,
                appScopeProvider: vm,
                columnDefs: [
                    resourceNameColumn,
                    resourceTypeColumn,
                    resourceDescriptionColumn,
                    resourceLocationColumn,
                    meetingNameColumn,
                    meetingAttendingUsersColumn,
                    bookedStartTimeColumn,
                    bookedEndTimeColumn,
                    commentColumn,
                    createdByColumn,
                    createdAtColumn,
                    exportColumn,
                    deleteColumn,
                    rebookColumn
                ]
            };

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentLimit = resourceBookingsPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentOffset = 0;

            /**
             * default sorting
             * must be the same as in app/js/services/dynamicTableSettings/defaultTableStates.js
             */
            vm.defaultOrderBy = "date_time_start";
            vm.defaultOrderDir = "desc";
            vm.orderBy = vm.defaultOrderBy;
            vm.orderDir = vm.defaultOrderDir;

            var sortOptions = DynamicTableSettingsService.getColumnSortingAndMatchNameToField('grid_state_resourcebookings');

            if (sortOptions['sortField']) {
                vm.orderBy = sortOptions['sortField'];
            }

            if (sortOptions['sortDir']) {
                vm.orderDir = sortOptions['sortDir'];
            }

            vm.getMyResourceBookings(vm.currentLimit, vm.currentOffset);
        };

        // is triggered when the resource was booked (resourceBookWidget.js)
        $rootScope.$on("resource-booked", function (event, args) {
            vm.getMyResourceBookings(vm.currentLimit, vm.currentOffset);
        });

        // is triggered when the resource was deleted, trashed or restored (genericDeleteMenu.js)
        $scope.$on('objectDeletedEvent', function () {
            vm.getMyResourceBookings(vm.currentLimit, vm.currentOffset);
        });

        /**
         * Save the hidePastBookings ui setting to the db
         */
        vm.saveSetting = function () {
            UiSettingsService.save(vm.hidePastBookingsKey, vm.hidePastBookings).catch(
                function error () {
                    toaster.pop('error', gettextCatalog.getString("Could not save hide past booking setting"));
                }
            );
        };

        vm.prepareResults = function (response) {
            var resourceBookings = response;

            var count = response.$httpHeaders(PaginationCountHeader.getHeaderName());

            if (count) {
                vm.numberOfResourceBookings = count;
            }

            vm.resourceBookings = resourceBookings;

            vm.gridOptions.data = vm.resourceBookings;
            vm.resourceBookingsLoaded = true;
        };

        /**
         * Query ResourceBookings from the REST API
         */
        vm.getMyResourceBookings = function (limit, offset) {
            // if no limit is defined, use the default ``resourceBookingsPerPage``
            if (limit === undefined) {
                limit = resourceBookingsPerPage;
            }
            // if no offset is defined, begin at 0
            if (offset === undefined) {
                offset = 0;
            }
            /**
             * Defines the filters for the REST API for recent changes
             * @type {{limit: *, offset: *, model: (undefined|*)}}
             */
            var filters = {limit: limit, offset: offset};

            if (vm.orderBy && vm.orderDir) {
                filters['ordering'] = (vm.orderDir === 'asc' ? '' : '-') + vm.orderBy;
            }

            if (vm.hidePastBookings) {
                filters['date_time_end__gt'] = moment().toISOString();
            }

            // if vm.resource exists it means that we are in a detail view, then we only
            // query for the bookings for this resource
            if (vm.resource) {
                filters['resource'] = vm.resource.pk;
            }

            // this queries all resource booking for the list view
            return MyResourceBookingsRestService.query(filters).$promise.then(
                function success (response) {
                    vm.prepareResults(response);
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Could not load resourcebookings"));
                }
            );
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * resourceBookingsPerPage;
            vm.currentLimit = resourceBookingsPerPage;

            vm.getMyResourceBookings(vm.currentLimit, vm.currentOffset);
        };


        /**
         * On delete button click present a modal dialog that asks the user whether to really delete
         * the ResourceBooking or not
         * @returns {*}
         */
        vm.deleteResourceBooking = function (resourceBooking) {
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Delete Resource Booking?'),
                message: gettextCatalog.getString('Do you really want to delete this booking for ')
                    + resourceBooking.resource.name + '?',
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Delete'),
                dialogKey: 'DeleteResourceBooking'
            });

            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        resourceBooking.$delete().then(
                            function success (response) {
                                toaster.pop('success', gettextCatalog.getString("Deleted"));
                                $rootScope.$broadcast('objectDeletedEvent');
                            },
                            function error (rejection) {
                                console.log(rejection);
                                if (rejection.data && rejection.data.non_field_errors) {
                                    toaster.pop('error', gettextCatalog.getString("Delete failed"),
                                        rejection.data.non_field_errors.join(" ")
                                    );
                                } else {
                                    toaster.pop('error', gettextCatalog.getString("Delete failed"));
                                }
                            }
                        );
                    }
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }
            );
        };

        /**
         * Shows a edit booking dialog
         */
        vm.editBooking = function (booking) {
            var modalService = ResourceBookingCreateEditModalService;

            // create a modal and wait for a result
            var modal = modalService.openEdit(booking);

            modal.result.then(function () {
                vm.getMyResourceBookings(vm.currentLimit, vm.currentOffset);
            });
        };

        vm.goToMeeting = function (meeting) {
            NavigationService.goToModelView(meeting, false);
        };

        /**
         * Shows a rebook dialog
         */
        vm.rebookResource = function (booking) {
            // rebook resource
            var duplicatedObject = angular.copy(booking);

            delete duplicatedObject.pk;
            delete duplicatedObject.created_at;
            delete duplicatedObject.created_by;
            delete duplicatedObject.last_modified_at;
            delete duplicatedObject.last_modified_by;
            delete duplicatedObject.url;
            delete duplicatedObject.display;
            delete duplicatedObject.deleted;
            delete duplicatedObject.version_number;
            delete duplicatedObject.$promise;
            delete duplicatedObject.$resolve;

            // adjust times so they aren't in the past
            duplicatedObject.date_time_start = moment().startOf('hour').add(1, 'h');
            duplicatedObject.date_time_end = moment().startOf('hour').add(2, 'h');

            var modalService = ResourceBookingCreateEditModalService,
                resource = booking.resource;

            // create a modal and wait for a result
            var modal = modalService.openCreate(duplicatedObject, resource);

            modal.result.then(modalService.viewElement)
                .catch(
                    function () {
                        console.log("Modal canceled");
                    }
                );
        };

        /**
         * Exports a single booking
         */
        vm.exportResourceBooking = function (resourceBooking) {
            MyResourceBookingsRestServiceExport.export(resourceBooking.pk).then(function (response) {
                var data = new Blob([response.data], {type: 'application/pdf;charset=utf-8'});

                FileSaver.saveAs(data, 'resourceBooking_' + resourceBooking.pk + '.pdf');
            });
        };

        /**
         * Exports all visible bookings
         */
        vm.exportAllResourceBookings = function () {
            var pkList = [];

            for (var i = 0; i < vm.resourceBookings.length; i++) {
                pkList.push(vm.resourceBookings[i].pk)
            }

            if (pkList.length > 0) {
                MyResourceBookingsRestServiceExport.export_many(pkList.join(',')).then(function (response) {
                    var data = new Blob([response.data], {type: 'application/pdf;charset=utf-8'});

                    FileSaver.saveAs(data, 'resourceBookings_' + moment() + '.pdf');
                });
            } else {
                toaster.pop('error', gettextCatalog.getString("Nothing to export"));
            }
        };

        // Watch the hide past bookings checkbox and load the bookings again on change
        $scope.$watch("vm.hidePastBookings", function (newVal, oldVal) {
            // only load data if the value changes, so it doesn't load data on init for a second time
            if (oldVal !== newVal) {
                vm.getMyResourceBookings(vm.currentLimit, vm.currentOffset);
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
                vm.getMyResourceBookings(vm.currentLimit, vm.currentOffset);
            }
            if ((newValue !== oldValue) && (vm.orderBy !== null)) {
                // triggered when sorting by column or direction has changed (But not on sort-reset)
                vm.getMyResourceBookings(vm.currentLimit, vm.currentOffset);
            }
        }, true);
    });
})();
