/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Contact List as cards
     */
    module.component('contactCardView', {
        templateUrl: 'js/screens/contact/contactCardView.html',
        controller: 'ContactCardViewController',
        controllerAs: 'vm',
        bindings: {
            'contacts': '<'
        }
    });

    /**
     * Controller for contact list as cards
     */
    module.controller('ContactCardViewController', function () {
        "ngInject";

        // var vm = this;
    });
})();
