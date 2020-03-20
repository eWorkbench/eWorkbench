/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    module.directive('meetingAttendingUsersCellWidget', function () {
        return {
            templateUrl: 'js/widgets/meetingAttendingUsersCellWidget/meetingAttendingUsersCellWidget.html',
            controller: 'MeetingAttendingUsersCellWidget',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                meeting: '='
            }
        }
    });

    /**
     * Controller for directive meetingAttendingUsersCellWidget
     */
    module.controller('MeetingAttendingUsersCellWidget', function (
        $uibModal,
        meetingAttendingUsersModalService
    ) {
        'ngInject';

        var
            vm = this;

        /**
         * Displays a modal dialog with a list of attending users
         * @param meeting
         */
        vm.showAttendingUsersForMeeting = function (meeting) {
            meetingAttendingUsersModalService.openModal(meeting);
        };
    });
})();
