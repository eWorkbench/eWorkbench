/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name notificationsNavbarWidget
     *
     * @restrict E
     *
     * @description Notification Navigation Bar Widget
     * Displays some notifications for the current users within the navbar
     */
    module.directive('notificationsNavbarWidget', function () {
        return {
            restrict: 'E',
            controller: "NotificationsNavbarWidgetController",
            controllerAs: 'vm',
            bindToController: true,
            templateUrl: 'js/widgets/notificationsNavbarWidget/notificationsNavbarWidget.html'
        };
    });

    /**
     * Controller for the notificationsNavbarWidget directive
     */
    module.controller('NotificationsNavbarWidgetController', function (
        $scope,
        $location,
        $injector,
        $interval,
        $q,
        $state,
        $transitions,
        IconImagesService,
        NotificationService
    ) {
        "ngInject";

        var vm = this;

        /**
         * List of notifications to display
         * @type {Array}
         */
        vm.notifications = NotificationService.notifications;

        vm.notificationService = NotificationService;

        /**
         * whether the popover is opened or not
         * @type {boolean}
         */
        vm.popoverOpened = false;

        /**
         * Save the notification as "read"
         * @param notification
         */
        vm.readNotification = function (notification) {
            return NotificationService.readNotification(notification);
        };

        /**
         * Mark all notifications as read
         * @returns {*|{method, isArray, url}}
         */
        vm.markAllAsRead = function () {
            return NotificationService.markAllAsRead();
        };

        // transition handler -> close popover when a transition happens
        $transitions.onBefore({}, function (trans) {
            vm.popoverOpened = false;

            // authed --> allow transition
            return true;
        });
    });
})();
