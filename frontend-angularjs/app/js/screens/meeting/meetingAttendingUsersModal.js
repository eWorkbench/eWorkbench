/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.service('meetingAttendingUsersModalService', function ($uibModal) {
        "ngInject";

        return {
            'openModal': function (meeting) {
                return $uibModal.open({
                    templateUrl: 'js/screens/meeting/meetingAttendingUsersModal.html',
                    controller: 'MeetingAttendingUsersModalController',
                    resolve: {
                        meeting: function () {
                            return meeting;
                        }
                    }
                });
            }
        };
    });

    module.controller('MeetingAttendingUsersModalController', function (
        $scope,
        $uibModalInstance,
        meeting
    ) {
        "ngInject";

        $scope.meeting = meeting;

        $scope.dismiss = function () {
            $uibModalInstance.dismiss();
        }
    });
})();
