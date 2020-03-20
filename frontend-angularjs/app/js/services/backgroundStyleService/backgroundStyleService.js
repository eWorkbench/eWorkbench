/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Service for holding information about the background style
     */
    module.service('BackgroundStyleService', function () {

        var
            service = {},
            _listeners = [],

            backgroundImage = null,
            backgroundColor = null,

            notifySubscribers = function () {
                for (var i = 0; i < _listeners.length; i++) {
                    if (typeof _listeners[i] === 'function') {
                        _listeners[i](buildBackgroundInfo());
                    }
                }
            },

            buildBackgroundInfo = function () {
                return {
                    color: backgroundColor,
                    image: backgroundImage
                };
            };

        service.setColor = function (rgba) {
            backgroundColor = rgba;
            notifySubscribers();
        };

        service.setImage = function (image) {
            backgroundImage = image;
            notifySubscribers();
        };

        service.clear = function () {
            backgroundImage = null;
            backgroundColor = null;
            notifySubscribers();
        };

        /**
         * Subscribe to changes
         * @param listener a function that is called when the background changes
         */
        service.subscribe = function (listener) {
            _listeners.push(listener);
            listener(buildBackgroundInfo()); // immediately send latest value
        };

        service.unsubscribe = function (listener) {
            var idx = _listeners.indexOf(listener);

            if (idx > -1) {
                _listeners.splice(idx, 1);
            }
        };

        return service;
    });
})();
