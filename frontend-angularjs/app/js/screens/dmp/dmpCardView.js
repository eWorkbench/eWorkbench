/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * DMP List as cards
     */
    module.component('dmpCardView', {
        templateUrl: 'js/screens/dmp/dmpCardView.html',
        controller: 'DMPCardViewController',
        controllerAs: 'vm',
        bindings: {
            'dmps': '<'
        }
    });

    /**
     * Controller for dmp list as cards
     */
    module.controller('DMPCardViewController', function () {
        "ngInject";

        // var vm = this;
    });
})();
