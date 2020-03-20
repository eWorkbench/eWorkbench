/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Resource List as cards
     */
    module.component('resourceCardView', {
        templateUrl: 'js/screens/resource/resourceCardView.html',
        controller: 'ResourceCardViewController',
        controllerAs: 'vm',
        bindings: {
            'resources': '<'
        }
    });

    /**
     * Controller for resource list as cards
     */
    module.controller('ResourceCardViewController', function () {
        "ngInject";

    });
})();
