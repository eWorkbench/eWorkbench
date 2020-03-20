/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('screens');

    /**
     * Component for redirecting a notification to its detail page
     */
    module.component('notificationRedirect', {
        templateUrl: 'js/screens/notification/notificationRedirect.html',
        controller: 'NotificationRedirectController',
        controllerAs: 'vm',
        bindings: {
            'notification': '='
        }
    });

    /**
     * Controller for the notificationRedirect component
     */
    module.controller('NotificationRedirectController', function (
        $scope,
        $injector,
        $q,
        NotificationService
    ) {
        var vm = this;

        this.$onInit = function () {
            console.log(vm.notification);

            var promises = [];

            if (!vm.notification.read) {
                console.log("Notification has not been read yet, marking it as read");

                promises.push(
                    NotificationService.readNotification(vm.notification)
                );
            }

            // redirect
            $q.all(promises).then(
                function done () {
                    // redirect
                    console.log("redirect to ... " + vm.notification.url);

                    window.location.href = vm.notification.url;
                }
            )
        };
    });
})();
