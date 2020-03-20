/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Widget for counting down a time (in minutes)
     * This widget takes special care about the performance impact, by not using $timeout, but setTimeout() and other
     * tricks.
     */
    module.directive('timeCountdownWidget', function () {
        return {
            restrict: 'E',
            scope: {
                remainingTime: '='
            },
            link: function (scope, element, attrs) {
                scope.element = element;
            },
            controller: 'TimeCountdownWidgetController'
        };
    });

    /**
     * controller for time-countdown-widget
     */
    module.controller('TimeCountdownWidgetController', function ($scope, gettextCatalog) {
        /**
         * Timer for canceling/clearing
         **/
        var updateTimer = undefined;

        /**
         * How often the timer is called (in milliseconds)
         * @type {number}
         */
        var updateInterval = 5000;

        /**
         * The actual remaining time that we are counting down
         * @type {number}
         */
        var actualRemainingTime = 0;

        /**
         * Initialize the clock and the updateTimer
         */
        var initTimer = function () {
            // clear existing interval timers
            disableTimer();

            updateTimer = setInterval(updateCountdown, updateInterval);

            // update current time once
            updateCountdown();
        };

        /**
         * Disable the timer
         */
        var disableTimer = function () {
            if (updateTimer) {
                clearTimeout(updateTimer);
                updateTimer = undefined;
            }
        };

        /**
         * Update countdown text
         */
        var updateCountdown = function () {
            // decrease
            actualRemainingTime -= updateInterval / 1000.0;

            var str = "";
            var minutes = Math.round(actualRemainingTime / 60);

            if (actualRemainingTime > 60) {
                str += minutes + " " + gettextCatalog.getString("minutes");
            } else {
                str += gettextCatalog.getString("less than a minute");
            }

            $scope.element.text(str);
        };

        /**
         * Watch remaining time
         * On change, update actualRemainingTime and re-initialize the timer (interval)
         */
        $scope.$watch('remainingTime', function () {
            console.log('TimeCountdownWidgetController(' + $scope.$id + '): remaining time has changed to: ' + $scope.remainingTime);

            actualRemainingTime = $scope.remainingTime;

            if ($scope.remainingTime <= 0) {
                // disable the timer
                disableTimer();
            } else {
                // initialize timer
                initTimer();
            }
        });

        /**
         * On Destroy of this directive, we need to cancel the timer
         */
        $scope.$on(
            "$destroy",
            function (event) {
                console.log('TimeCountdownWidgetController(' + $scope.$id + '): destroying');
                if (updateTimer) {
                    clearTimeout(updateTimer);
                }
            }
        );
    });
})();
