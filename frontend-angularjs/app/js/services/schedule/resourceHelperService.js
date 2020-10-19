/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Provides functionality to filter a list of resources by users.
     */
    module.service('ResourceHelperService', function () {
        'ngInject';

        var service = {};

        /**
         * Returns true if all of the wantedUserPks is associated to the given event (appointment/task).
         * Also returns true, if there are no defined wantedUserPks.
         * @param event
         * @param wantedUserPks
         */
        service.resourceContainsAllWantedUsers = function (event, wantedResources) {
            if (!wantedResources || wantedResources.length === 0) {
                return true;
            }

            // in resourceCardView data can be loaded by an infinite-scroll-like mechanism
            // and the noDataAvailable value can occur
            if (event.content_type_model === 'noDataAvailable') {
                return true;
            }

            // check that every wanted user is associated with the event
            for (var i = 0; i < wantedResources.length; i++) {
                if (event.pk != wantedResources[i].pk) {
                    return false;
                }
            }

            return true;
        };

        service.selectColor = function (amountSelected) {
            var pastelColors = [
                "#F1E0B0",
                "#97F2F3",
                "#F1CDB0",
                "#E7CFC8",
                "#F3D1DC",
                "#F6A7C1",
                "#FCF0CF",
                "#FDCF76",
                "#B16E4B",
                "#38908F",
                "#B2EBE0",
                "#5E96AE",
                "#FFBFA3",
                "#E08963"
            ];

            return pastelColors[amountSelected];
        };

        service.getResourceColor = function (schedule, selectedResources) {
            var defaultColor = '#badee0';

            if (!selectedResources || selectedResources.length === 0) {
                return defaultColor;
            }

            if ("resource" in schedule && schedule.content_type_model === 'shared_elements.meeting') {
                for (var i = 0; i < selectedResources.length; i++) {
                    if (schedule["resource"] && schedule["resource"].pk === selectedResources[i].pk) {
                        return this.selectColor(i);
                    }
                }
            }

            return defaultColor;
        };

        service.selectUserColor = function (amountSelected) {
            var userColors = [
                "#C2ED98",
                "#8f97cf",
                "#F7F570",
                "#98A9D7",
                "#d66b67",
                "#B243B6",
                "#F1F487",
                "#F59B7C",
                "#FED776",
                "#F363B1",
                "#FDBF3B",
                "#E08963",
                "#93EE81",
                "#FFBFA3"
            ];

            return userColors[amountSelected];
        };

        service.getUserColor = function (schedule, selectedUsers) {

            var defaultColor = '#badee0';

            for (var i = 0; i < selectedUsers.length; i++) {
                if (typeof selectedUsers[i] === 'string' || selectedUsers[i] instanceof String) {
                    for (var j = 0; j < schedule["attending_users"].length; j++) {
                        if (String(schedule["attending_users"][j].pk) === String(selectedUsers[i])) {

                            return this.selectUserColor(i);
                        }
                    }
                }
            }


            return defaultColor;
        };

        /**
         * Returns true if any of the wantedUserPks is associated to the given resource.
         * Also returns true, if there are no defined wantedUserPks.
         * @param event
         * @param wantedUserPks
         */
        service.resourceContainsAnyWantedUser = function (event, wantedUserPks) {
            if (!wantedUserPks || wantedUserPks.length === 0) {
                return true;
            }

            // in resourceCardView data can be loaded by an infinite-scroll-like mechanism
            // and the noDataAvailable value can occur
            if (event.content_type_model === 'noDataAvailable') {
                return true;
            }

            var userPks = service.getUserPksOfEvent(event);

            // check if any wanted user is associated with the event
            for (var i = 0; i < wantedUserPks.length; i++) {
                if (userPks.indexOf(wantedUserPks[i]) >= 0) {
                    return true;
                }
            }

            return false;
        };

        /**
         * Gets a list of the PKs of all users of an event (appointment/task).
         * @param event
         * @returns {Array}
         */
        service.getUserPksOfEvent = function (event) {
            var userPks = [],
                pk = null,
                users = service.getUsersOfEvent(event);

            for (var i = 0; i < users.length; i++) {
                pk = users[i].pk.toString();
                userPks.push(pk);
            }

            return userPks;
        };

        /**
         * Gets a list of all users of an event.
         * @param event
         * @returns {Array}
         */
        service.getUsersOfEvent = function (event) {
            var users = [];

            switch (event.content_type_model) {
                case 'shared_elements.meeting':
                    users = event.attending_users;
                    break;

                case 'shared_elements.task':
                    users = event.assigned_users;
                    break;

                default:
                    // default case to please linter
                    break;
            }

            return users;
        };

        /**
         * Gets a list of all users of a list of resources (appointments, tasks).
         * @param resourceList
         * @returns {Array}
         */
        service.getUsersOfResources = function (resourceList) {
            var users = [],
                event = null,
                eventUsers = null;

            for (var i = 0; i < resourceList.length; i++) {
                event = resourceList[i];
                eventUsers = service.getUsersOfEvent(event);
                users = users.concat(eventUsers);
            }

            return users;
        };

        return service;
    });

})();
