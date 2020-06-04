/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    /**
     * A directive which formats a userDisplay object coming from the REST API
     */
    module.directive('meetingLink', function () {
        return {
            templateUrl: 'js/widgets/link/meetingLink.html',
            controller: "MeetingLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                meeting: '='
            }
        }
    });

    module.controller('MeetingLinkController', function (
        $scope,
        $state
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch Appointment and generate an URL for the given appointment
         */
        $scope.$watch("vm.meeting", function () {
            if (vm.meeting) {
                vm.meetingUrl = $state.href("meeting-view", {meeting: vm.meeting});
            } else {
                vm.meetingUrl = "";
            }
        });
    });
})();
