/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Provides functionality to filter a list of schedules by users.
     */
    module.service('ScheduleHelperService', function () {
        'ngInject';

        var service = {};

        /**
         * Returns true if all of the wantedUserPks are associated to the given event (appointment/task).
         * Also returns true, if there are no defined wantedUserPks.
         * @param event
         * @param wantedUserPks
         */
        service.scheduleContainsAllWantedUsers = function (event, wantedUserPks) {
            if (!wantedUserPks || wantedUserPks.length === 0) {
                return true;
            }

            // in scheduleCardView data can be loaded by an infinite-scroll-like mechanism
            // and the noDataAvailable value can occur
            if (event.content_type_model === 'noDataAvailable') {
                return true;
            }

            // if the event is a meeting we return true as it is already filtered by user by the API
            if (event.content_type_model === 'shared_elements.meeting') {
                return true;
            }

            var userPks = service.getUserPksOfEvent(event);

            // check that every wanted user is associated with the event
            for (var i = 0; i < wantedUserPks.length; i++) {
                if (userPks.indexOf(wantedUserPks[i]) < 0) {
                    return false;
                }
            }

            return true;
        };

        /**
         * Returns true if the schedule is not already in schedules
         * @param schedule
         * @param schedules
         */
        service.scheduleIsNoDuplicate = function (schedule, schedules) {
            // in scheduleCardView data can be loaded by an infinite-scroll-like mechanism
            // and the noDataAvailable value can occur
            if (schedule.content_type_model === 'noDataAvailable') {
                return true;
            }

            for (var i = 0; i < schedules.length; i++) {
                if (schedules[i].pk === schedule.pk) {
                    return false;
                }
            }

            return true;
        };

        /**
         * Returns true if any of the wantedUserPks is associated to the given schedule.
         * Also returns true, if there are no defined wantedUserPks.
         * @param event
         * @param wantedUserPks
         */
        service.scheduleContainsAnyWantedUser = function (event, wantedUserPks) {
            if (!wantedUserPks || wantedUserPks.length === 0) {
                return true;
            }

            // in scheduleCardView data can be loaded by an infinite-scroll-like mechanism
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

                case 'projects.resourcebooking':
                    users = [event.created_by];
                    break;

                default:
                    // default case to please linter
                    break;
            }

            return users;
        };

        /**
         * Gets a list of all users of a list of schedules (appointments, tasks).
         * @param scheduleList
         * @returns {Array}
         */
        service.getUsersOfSchedules = function (scheduleList) {
            var users = [],
                event = null,
                eventUsers = null;

            for (var i = 0; i < scheduleList.length; i++) {
                event = scheduleList[i];
                eventUsers = service.getUsersOfEvent(event);
                users = users.concat(eventUsers);
            }

            return users;
        };

        return service;
    });

})();
