/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Workbench Element Changes WebSocket which receives events about changes on the specified workbench element.
     *
     * Currently, the following events are supported:
     * - auth_success - received when authentication is successful; triggers the authPromise
     * - element_changed - received when something about an element has changed
     * - locked - received when the lock status of an element has changed
     */
    module.service('WorkbenchElementChangesWebSocket', function (
        $timeout,
        $websocket,
        $q,
        websocketsUrl,
        AuthLocalStorageService
    ) {
        var service = {};

        /**
         * Dictionary containing subscribed elements
         *
         * Key: {modelName}_{pk}
         * @type {{}}
         */
        var subscribedElements = {};

        // Open a WebSocket connection to the elements websockets, with the given model name and model pk
        var dataStream = $websocket(
            websocketsUrl + 'elements/',
            {
                // make sure to reconnect to the websocket if it was closed accidentally (e.g., connection loss)
                'reconnectIfNotNormalClose': true
            }
        );

        /**
         * Promise for when authentication has succeeded
         */
        var authPromise = $q.defer();

        /**
         * (Re-)subscribe to all existing subscribedElements
         */
        var registerResubscribeHandler = function () {
            authPromise.promise.then(function resubscribe () {
                console.log("authPromise fired! (re-)subscribing...");

                for (var key in subscribedElements) {
                    if (subscribedElements.hasOwnProperty(key)) {
                        if (subscribedElements[key] !== undefined && subscribedElements[key].length > 0) {
                            // parse key: {modelName}/{pk}
                            var parsedKey = key.split("/");
                            var modelName = parsedKey[0];
                            var modelPk = parsedKey[1];

                            console.log("WorkbenchElementChangesWebSocket: (Re-)subscribing to " +
                                modelName + "/" + modelPk);

                            doSubscribeViaWS(modelName, modelPk);
                        }
                    }
                }
            });
        };

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

            registerResubscribeHandler();
        });

        // some debug output for onClose
        dataStream.onClose(function (event) {
            console.log("WorkbenchElementChangesWebSocket closed");
            console.log(event);

            authPromise = $q.defer();
        });

        // some debug output for onError
        dataStream.onError(function (error) {
            console.log("WorkbenchElementChangesWebSocket error");
            console.log(error);

            authPromise = $q.defer();
        });

        /**
         * Handle arriving messages, mainly
         * - auth_success
         * - element_changed
         * - locked
         */
        dataStream.onMessage(function (message) {
            var jsonMessage = angular.fromJson(message.data);

            console.log("message received from WebSocket:");
            console.dir(jsonMessage);

            // on auth_success: resolve the authPromise
            if (jsonMessage['auth_success']) {
                authPromise.resolve();
            } else {
                // dispatch the message
                var modelName = null,
                    modelPk = null;

                // on element_changed: modify lastVersion.version (using $timeout to trigger a digest cycle)
                if (jsonMessage['element_changed'] !== undefined) {
                    // message contains model_name and model_pk - we need to fire an event for that
                    modelName = jsonMessage['element_changed']['model_name'];
                    modelPk = jsonMessage['element_changed']['model_pk'];
                }

                if (jsonMessage['element_lock_changed'] !== undefined) {
                    // message contains model_name and model_pk - we need to fire an event for that
                    modelName = jsonMessage['element_lock_changed']['model_name'];
                    modelPk = jsonMessage['element_lock_changed']['model_pk'];
                }

                if (jsonMessage['element_relations_changed'] !== undefined) {
                    // message contains model_name and model_pk - we need to fire an event for that
                    modelName = jsonMessage['element_relations_changed']['model_name'];
                    modelPk = jsonMessage['element_relations_changed']['model_pk'];
                }

                if (jsonMessage['kanbanboard_task_assignment_changed'] !== undefined) {
                    // message contains model_name and model_pk - we need to fire an event for that
                    modelName = jsonMessage['kanbanboard_task_assignment_changed']['model_name'];
                    modelPk = jsonMessage['kanbanboard_task_assignment_changed']['model_pk'];
                }

                if (jsonMessage['kanbanboard_task_assignment_deleted'] !== undefined) {
                    // message contains model_name and model_pk - we need to fire an event for that
                    modelName = jsonMessage['kanbanboard_task_assignment_deleted']['model_name'];
                    modelPk = jsonMessage['kanbanboard_task_assignment_deleted']['model_pk'];
                }

                if (jsonMessage['kanbanboard_column_changed'] !== undefined) {
                    // message contains model_name and model_pk - we need to fire an event for that
                    modelName = jsonMessage['kanbanboard_column_changed']['model_name'];
                    modelPk = jsonMessage['kanbanboard_column_changed']['model_pk'];
                }

                if (jsonMessage['labbook_child_element_changed'] !== undefined) {
                    // message contains model_name and model_pk - we need to fire an event for that
                    modelName = jsonMessage['labbook_child_element_changed']['model_name'];
                    modelPk = jsonMessage['labbook_child_element_changed']['model_pk'];
                }

                if (modelName && modelPk) {

                    var subscribers = subscribedElements[modelName + "/" + modelPk];

                    console.log("WorkbenchElementChangesWebSocket: " + modelName + "/" + modelPk + " has " +
                        subscribers.length + " subscribers");

                    // iterate over those subscribers
                    for (var i = 0; i < subscribers.length; i++) {
                        subscribers[i].callback(jsonMessage);
                    }
                }
            }
        });

        /**
         * Returns the authentication promise
         * @returns {*}
         */
        service.waitForAuthentication = function () {
            return authPromise.promise;
        };

        /**
         * Disconnect the websocket
         */
        service.disconnect = function () {
            // unsubscribe from all
            dataStream.send(
                JSON.stringify({
                    action: 'unsubscribe_all'
                })
            );

            dataStream.close();
        };


        service.unlockElement = function (modelName, modelPk) {
            dataStream.send(
                JSON.stringify({
                    action: 'unlock',
                    model_name: modelName,
                    model_pk: modelPk
                })
            );
        };

        service.lockElement = function (modelName, modelPk) {
            dataStream.send(
                JSON.stringify({
                    action: 'lock',
                    model_name: modelName,
                    model_pk: modelPk
                })
            );
        };

        var doSubscribeViaWS = function (modelName, modelPk) {
            dataStream.send(
                JSON.stringify({
                    action: 'subscribe',
                    model_name: modelName,
                    model_pk: modelPk
                })
            );
        };

        /**
         * Subscribe to a workbench element
         * @param modelName
         * @param modelPk
         * @param onChangeCallback
         * @returns {unsubscribe}
         */
        service.subscribe = function (modelName, modelPk, onChangeCallback) {
            // check if we are already subscribed
            if (subscribedElements[modelName + "/" + modelPk] !== undefined &&
                subscribedElements[modelName + "/" + modelPk].length > 0) {
                // already subscribed
                console.log("WorkbenchElementChangesWebSocket: " + modelName + "/" + modelPk +
                    " is already subscribed");
            } else {
                console.log("WorkbenchElementChangesWebSocket: " + modelName + "/" + modelPk +
                    " subscribing now...");

                subscribedElements[modelName + "/" + modelPk] = [];

                // subscribe via websocket
                doSubscribeViaWS(modelName, modelPk);
            }

            var uniqueId = window.guid();

            // push a listener
            subscribedElements[modelName + "/" + modelPk].push({
                id: uniqueId,
                callback: onChangeCallback
            });

            // return the unsubscribe function
            return function unsubscribe () {
                var subscribers = subscribedElements[modelName + "/" + modelPk];

                console.log("WorkbenchElementChangesWebSocket: " + modelName + "/" + modelPk + " has " +
                    subscribers.length + " subscribers");

                // Find this object
                var idx = -1;

                for (var i = 0; i < subscribers.length; i++) {
                    if (subscribers[i].id == uniqueId) {
                        idx = i;
                        break;
                    }
                }

                subscribers.splice(idx, 1);

                // unsubscribe if this is was the last subscriber
                if (subscribers.length == 0) {
                    console.log("WorkbenchElementChangesWebSocket: " + modelName + "/" + modelPk + " unsubscribing " +
                        "from WebSocket, as there are no subscribers left...");
                    dataStream.send(
                        JSON.stringify({
                            action: 'unsubscribe',
                            model_name: modelName,
                            model_pk: modelPk
                        })
                    );

                    // also remove this from subscribedElements
                    subscribedElements[modelName + "/" + modelPk] = undefined;
                } else {
                    console.log("WorkbenchElementChangesWebSocket: " + modelName + "/" + modelPk + " still has " +
                        subscribers.length + " subscribers - not unsubscribing from WS");
                }
            }
        };

        return service;
    });
})();
