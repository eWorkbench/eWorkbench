/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Drive List as cards
     */
    module.component('driveCardView', {
        templateUrl: 'js/screens/drive/driveCardView.html',
        controller: 'DriveCardViewController',
        controllerAs: 'vm',
        bindings: {
            'drives': '<',
            'searchField': '<'
        }
    });

    /**
     * Controller for drive list as cards
     */
    module.controller('DriveCardViewController', function () {
        "ngInject";

        // var vm = this;
    });
})();
