/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');


    /**
     * Notification WebSocket which receives events about notifications from a websocket.
     * If a notification event is received, it is furthermore passed on to all listeners.
     *
     * To register a listener, call NotificationWebSocket.subscribe(function () { ... });
     */
    module.factory('NotificationWebSocket', function (
        $websocket,
        AuthLocalStorageService,
        websocketsUrl
    ) {
        var
            service = {},

            //listeners to call when project change
            _listeners = [],

            //call all listeners
            emitNotificationChange = function (message) {
                for (var i = 0; i < _listeners.length; i++) {
                    if (typeof _listeners[i] === 'function') {
                        _listeners[i](message);
                    }
                }
            };

        // Open a WebSocket connection to the notifications websocket
        var dataStream = $websocket(
            websocketsUrl + 'notifications/',
            {
                // make sure to reconnect to the websocket if it was closed accidentally (e.g., connection loss)
                'reconnectIfNotNormalClose': true
            }
        );

        /**
         * Handle arriving messages
         */
        dataStream.onMessage(function (message) {
            var jsonMessage = angular.fromJson(message.data);

            if (!jsonMessage['auth_success']) {
                // forward the message to all listeners
                emitNotificationChange(jsonMessage);
            }
        });

        /**
         * Send auth request when the websocket is opened
         */
        dataStream.onOpen(function () {
            // send auth token
            dataStream.send(
                JSON.stringify({
                    'authorization': AuthLocalStorageService.getToken()
                })
            );
        });

        // some debug output for onClose
        dataStream.onClose(function (event) {
            console.log("NotificationWebsocket closed:");
            console.log(event);
        });

        // some debug output for onError
        dataStream.onError(function (error) {
            console.log("NotificationWebsocket Error:");
            console.log(error);
        });

        /**
         * Subscribe to changes on the selected project
         * @param listener a function that is called when the selected project changes
         * @returns {unsubscribe} unsubscribe function, call when you want to unsubscribe
         */
        service.subscribe = function (listener) {
            // add to listeners
            _listeners.push(listener);

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
