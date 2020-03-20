/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('services');

    /**
     * Service for providing task type info
     */
    module.factory('MeetingConverterService', function (PaginationCountHeader) {
        'ngInject';

        var service = {};

        service.transformResponseForMeetingArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    service.convertMeetingFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    service.convertMeetingFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };

        service.transformResponseForMeeting = function (data, headersGetter) {
            var meeting = angular.fromJson(data);

            return service.convertMeetingFromRestAPI(meeting);
        };
        /**
         * add start and end to the meeting
         *    start and end are used for the angular ui calendar
         * convert date_time_start and date_time_end
         * @param meeting
         * @returns {*}
         */
        service.convertMeetingFromRestAPI = function (meeting) {
            // do not convert objects that do not contain an actual meeting
            // this is the case when rest api throws an error
            if (!meeting.pk) {
                return meeting;
            }

            // meeting.project_pk = meeting.project;
            meeting.date_time_start = moment(meeting.date_time_start);
            meeting.date_time_end = moment(meeting.date_time_end);
            meeting.start = meeting.date_time_start;
            meeting.end = meeting.date_time_end;

            return meeting;
        };

        return service;
    });
})();
