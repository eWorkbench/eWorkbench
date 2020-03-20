/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('screens');

    /**
     * Component for displaying a list of notifications of the current user
     *
     * Displays a paginated list of notifications
     */
    module.component('notificationsList', {
        templateUrl: 'js/screens/notification/notificationsList.html',
        controller: 'NotificationsListController',
        controllerAs: 'vm'
    });

    /**
     * Controller for the notificationsList component
     */
    module.controller('NotificationsListController', function (
        $scope,
        $q,
        NotificationRestService
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * Config: Number of changes displayed per page
             * @type {number}
             */
            vm._changesPerPage = 15;

            /**
             * The current page of notifications (required for pagination)
             * @type {number}
             */
            vm.currentPage = 1;

            /**
             * List of notifications
             * @type {Array}
             */
            vm.notifications = [];

            /**
             * Total number of notifications (required for pagination)
             * @type {number}
             */
            vm.numberOfNotifications = 0;

            /**
             * Number of notifications per page
             * @type {number}
             */
            vm.currentLimit = vm._changesPerPage;

            vm.getNotifications();
        };

        /**
         * Mark a notification as read
         * @param notification the notification that should be marked as read
         * @returns {Promise}
         */
        vm.readNotification = function (notification) {
            // check if notification has been read already
            if (notification.read) {
                return $q.when();
            }

            return notification.$userHasReadNotification().then(
                function success (response) {
                    notification.read = response.read;

                    return notification;
                },
                function error (rejection) {
                    console.log(rejection);
                }
            );
        };

        /**
         * Get paginated notifications from REST API
         * @param limit
         * @param offset
         */
        vm.getNotifications = function (limit, offset) {
            if (limit === undefined) {
                limit = vm._changesPerPage;
            }
            // if no offset is defined, begin at 0
            if (offset === undefined) {
                offset = 0;
            }

            var filters = {limit: limit, offset: offset};

            return NotificationRestService.queryPaged(filters).$promise.then(
                function success (response) {
                    vm.notifications = response.results;

                    if (response.count) {
                        vm.numberOfNotifications = response.count;
                    }
                }
            );
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * vm._changesPerPage;
            vm.currentLimit = vm._changesPerPage;

            vm.getNotifications(vm.currentLimit, vm.currentOffset);
        };
    });
})();
