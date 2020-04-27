/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Notification Service which continously updates notifications from REST API
     * also creates toaster notifications for new notifications
     */
    module.service('NotificationService', function (
        $rootScope,
        $interval,
        $q,
        NotificationRestService,
        NotificationWebSocket,
        toaster,
        gettextCatalog
    ) {
        "ngInject";

        var service = {
            /**
             * List of notifications
             * @type {Array}
             */
            notifications: [],

            /**
             * Number of unread notifications
             */
            numberOfUnreadNotifications: 0
        };

        var firstTime = true;

        var nextRefreshNotificationsTimeout = null;

        // subscribe to the notification websocket
        var notificationWebSocketUnsubscribeFunction = NotificationWebSocket.subscribe(function () {
            window.clearTimeout(nextRefreshNotificationsTimeout);

            // queue refreshNotifications in 100 ms
            nextRefreshNotificationsTimeout = window.setTimeout(refreshNotifications, 500);
        });

        /**
         * Unsubscribe to notification websocket when $rootScope is destroyed
         */
        $rootScope.$on("$destroy", function () {
            notificationWebSocketUnsubscribeFunction();
        });

        /**
         * Mark a notification as read via REST API
         * @param notification
         * @returns {Promise}
         */
        service.readNotification = function (notification) {
            if (notification.read) {
                // already read
                return $q.when();
            }

            // call rest API
            return NotificationRestService.userHasReadNotification(notification).$promise.then(
                function success (response) {
                    // mark the internal notification as read
                    var internalNotification = service.findNotificationByPk(notification.pk);

                    if (internalNotification) {
                        internalNotification.read = response.read;
                    }

                    // also change notification.read
                    notification.read = response.read;
                    // decrease number of read notifications
                    service.numberOfUnreadNotifications--;

                    return notification;
                }
            );
        };

        /**
         * Tries to find a notification by PK
         *
         * If not found, returns false
         * @param pk
         */
        service.findNotificationByPk = function (pk) {
            // find by pk
            for (var i = 0; i < service.notifications.length; i++) {
                if (service.notifications[i].pk == pk) {

                    return service.notifications[i];
                }
            }

            return false;
        };

        /**
         * Mark all notifications as read via REST API
         */
        service.markAllAsRead = function () {
            return NotificationRestService.markAllAsRead().$promise.then(
                function success (response) {
                    for (var i = 0; i < service.notifications.length; i++) {
                        service.notifications[i].read = true;
                    }

                    service.numberOfUnreadNotifications = 0;
                }
            );
        };

        /**
         * Tries to fetch a single notification by pk
         *
         * If it is in service.notifications, the same object is returned. Else, the notification is inserted into the
         * array
         * @param pk
         */
        service.getNotificationByPK = function (pk) {
            var defer = $q.defer();

            // find by pk
            var notification = service.findNotificationByPk(pk);

            if (notification) {
                defer.resolve(notification);
            } else {
                // query rest api
                NotificationRestService.get({pk: pk}).$promise.then(
                    function success (response) {
                        service.notifications.push(response);
                        defer.resolve(response);
                    },
                    function error (rejection) {
                        defer.reject(rejection);
                    }
                )
            }

            return defer.promise;
        };


        /**
         * Iterate over all notifications and extract the largest created_at datetime as a filter option
         * @returns {{}}
         */
        var getNotificationsQueryFilters = function () {
            var filters = {};

            if (service.notifications && service.notifications.length > 0) {
                // determine max date
                var maxDate = null;

                for (var i = 0; i < service.notifications.length; i++) {
                    var newDate = moment(service.notifications[i].last_modified_at);

                    if (newDate > maxDate) {
                        maxDate = newDate;
                    }
                }
                // add 1 second
                maxDate = maxDate.add('second', 1);

                filters['last_modified_at__gt'] = maxDate.toISOString();
            }

            return filters;
        };

        /**
         * Read notification and go to the element that is stored in the url of the notification
         * @param notification
         */
        var readNotificationAndGoToElement = function (notification) {
            service.readNotification(notification).then(
                function () {
                    // go to the notification url
                    window.location.href = notification.url;
                }
            );
        };

        /**
         * Pops a toaster notification with the provided notification
         * On-click navigate to the element that is linked with the notification
         * @param notification
         */
        var popNotificationToaster = function (notification) {
            // pop a toaster notification for this
            toaster.pop({
                'type': 'info',
                'title': notification.title,
                'clickHandler': function (toast, isCloseButton) {
                    // read notification
                    readNotificationAndGoToElement(notification);

                    return true;
                }
            });
        };

        /**
         * Refresh notifications from REST API (by date)
         *
         * This calls the notifications rest api with getNotificationsQueryFilters(), which essentially enable
         * pagination based on date.
         */
        var refreshNotifications = function () {
            console.log("Querying notifications...");

            return NotificationRestService.query(getNotificationsQueryFilters()).$promise.then(
                function success (response) {
                    var i = 0,
                        notification = null;

                    console.log("refreshNotifications: Got " + response.length + " notifications");

                    if (!firstTime && response.length >= 1) {
                        // show toaster for new notifications
                        for (i = 0; i < response.length; i++) {
                            if (!response[i].read) {
                                popNotificationToaster(response[i]);
                            }
                        }
                    }

                    // reset numberOfUnreadNotifications
                    service.numberOfUnreadNotifications = 0;

                    /** add notifications from response to service.notifications (check if they are in there already
                     * though)
                     */
                    for (i = 0; i < response.length; i++) {
                        notification = response[i];
                        var existingNotification = service.findNotificationByPk(notification.pk);

                        if (existingNotification) {
                            angular.merge(existingNotification, notification);
                        } else {
                            service.notifications.push(notification);
                        }
                    }

                    // check for new unread notifications
                    for (i = 0; i < service.notifications.length; i++) {
                        notification = service.notifications[i];

                        if (!notification.read) {
                            service.numberOfUnreadNotifications++;
                        }
                    }

                    // reset firstTime
                    firstTime = false;
                }, function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to query notifications"));
                }
            );
        };

        // get the initial batch of notifications
        refreshNotifications();

        return service;
    });
})();
