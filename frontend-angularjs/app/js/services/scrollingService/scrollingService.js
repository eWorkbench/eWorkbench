/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Scrolling Service
     * Provides an easy way to initiate smooth scrolling up/down (e.g. for Drag and Drop)
     * This uses jQuery scrollTop and a timeout
     * The provided methods are:
     * - ``startScrolling`` - starts smooth scrolling (by a specified amount of pixels)
     * - ``stopScrolling`` - stops/ends the scrolling immediately
     */
    module.service('scrollingService', function () {
        "ngInject";

        var service = {},
            /**
             * Whether the service is currently scrolling or not
             * @type {boolean}
             */
            isScrolling = false,
            /**
             * stores a timeout for the next scroll action
             * @type {null}
             */
            scrollingTimeout = null;

        /**
         * Start scrolling by a certain amount of pixels
         * @param byPixels
         */
        service.startScrolling = function (byPixels, elem) {
            elem = elem || window;

            isScrolling = true;

            scroll(byPixels, elem);
        };

        /**
         * Stop scrolling
         */
        service.stopScrolling = function () {
            clearTimeout(scrollingTimeout);

            isScrolling = false;
        };

        /**
         * Scroll function
         * Scrolls a certain amount of pixels (step) and queues the next scrolling event into ``scrollingTimeout``
         * @param step
         */
        var scroll = function (step, scrollElement) {
            var scrollY = jQuery(scrollElement).scrollTop();

            jQuery(scrollElement).scrollTop(scrollY + step);

            clearTimeout(scrollingTimeout);

            // if we are still scrolling, queue the next scrolling event via ``setTimeout``
            if (isScrolling) {
                scrollingTimeout = setTimeout(function () {
                    scroll(step, scrollElement)
                }, 25);
            }
        };

        return service;
    });
})();
