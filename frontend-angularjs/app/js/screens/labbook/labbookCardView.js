/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Labbook List as cards
     */
    module.component('labbookCardView', {
        templateUrl: 'js/screens/labbook/labbookCardView.html',
        controller: 'LabbookCardViewController',
        controllerAs: 'vm',
        bindings: {
            'labbooks': '<',
            'searchField': '<'
        }
    });

    /**
     * Controller for labbook list as cards
     */
    module.controller('LabbookCardViewController', function () {
        "ngInject";

        // var vm = this;
    });
})();
