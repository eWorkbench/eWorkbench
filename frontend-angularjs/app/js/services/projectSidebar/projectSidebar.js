/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Service for holding information about the current processed project
     */
    module.service('ProjectSidebarService', function () {

        var
            service = {},

            //listeners to call when project change
            _listeners = [],

            //current active project
            _project = null,

            //call all listeners
            emitProjectChange = function () {
                for (var i = 0; i < _listeners.length; i++) {
                    if (typeof _listeners[i] === 'function') {
                        _listeners[i](service.project);
                    }
                }
            };


        //call all listenes when setting the project
        Object.defineProperty(service, "project", {
            get: function () {
                return _project;
            },
            set: function (value) {
                if (_project !== value) {
                    _project = value;
                    emitProjectChange();
                }
            },
            enumerable: true,
            configurable: true
        });

        /**
         * Subscribe to changes on the selected project
         * @param listener a function that is called when the selected project changes
         * @returns {unsubscribe} unsubscribe function, call when you want to unsubscribe
         */
        service.subscribe = function (listener) {
            // add to listeners
            _listeners.push(listener);
            // call the listener right now
            listener(service.project);

            // return an "unsubscribe" function
            return function unsubscribe () {
                var idx = _listeners.indexOf(listener);

                if (idx > -1) {
                    _listeners.splice(idx, 1);
                }
            };
        };

        return service;
    });
})();
