/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Factory for services to query schedules (appointments, tasks) with filters.
     */
    module.factory('FilteredScheduleQueryFactory', function (
        $q,
        MyScheduleRestService
    ) {
        'ngInject';

        var factory = {};

        factory.createQuery = function () {
            factory.filters = {};

            return factory;
        };

        factory.filterProjects = function (projectPks) {
            if (projectPks && projectPks.length > 0) {
                factory.filters['projects_recursive'] = projectPks[0];
            }

            return factory;
        };

        factory.filterDateRange = function (start, end) {
            if (start && end) {
                // filter with meeting.end_date >= viewStartTime and meeting.start_date <= viewEndTime
                // see https://stackoverflow.com/a/328558/6289738 for an explanation
                factory.filters['end_date__gte'] = start.toISOString();
                factory.filters['start_date__lte'] = end.toISOString();
            }

            return factory;
        };

        factory.showMeetings = function (showMyMeetings, currentUserPk, selectedUsers) {
            // if My Meetings is checked we add the current user to selectedUsers if he isn't already in there
            if (showMyMeetings === true && currentUserPk) {
                if (!selectedUsers.includes(currentUserPk)) {
                    selectedUsers.push(currentUserPk);
                }
            }
            // if My Meetings is unchecked we remove the current user from selectedUsers
            if (showMyMeetings === false && currentUserPk) {
                var index = selectedUsers.indexOf(currentUserPk);

                if (selectedUsers.indexOf(currentUserPk) > -1) {
                    selectedUsers.splice(index, 1);
                }
            }
            // now we set up the filter for all selected users
            if (selectedUsers) {
                factory.filters['show_meetings_for'] = selectedUsers;
            }

            return factory;
        };

        factory.showMyTasks = function (showMyTasks) {
            if (showMyTasks === false) {
                factory.filters['show_tasks'] = 0;
            }

            return factory;
        };

        factory.searchText = function (text) {
            if (text && text !== "") {
                factory.filters['search'] = text;
            }

            return factory;
        };

        /**
         * Queries the schedules using the defined filters.
         * @returns {*}
         */
        factory.query = function () {
            var defer = $q.defer();

            MyScheduleRestService.query(factory.filters).$promise.then(
                function success (response) {
                    defer.resolve(response);
                },
                function error (rejection) {
                    defer.reject(rejection)
                }
            );

            return defer.promise;
        };

        return factory;
    });

})();
