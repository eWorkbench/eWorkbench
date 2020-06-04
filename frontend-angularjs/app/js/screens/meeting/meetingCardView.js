/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Appointment List as cards
     */
    module.component('meetingCardView', {
        templateUrl: 'js/screens/meeting/meetingCardView.html',
        controller: 'MeetingCardViewController',
        controllerAs: 'vm',
        bindings: {
            'meetings': '<'
        }
    });

    /**
     * Controller for appointment list as cards
     */
    module.controller('MeetingCardViewController', function () {
        "ngInject";
    });
})();
