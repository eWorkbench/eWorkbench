/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Project List as cards
     */
    module.component('projectCardView', {
        templateUrl: 'js/screens/project/projectCardView.html',
        controller: 'ProjectCardViewController',
        controllerAs: 'vm',
        bindings: {
            'projects': '<'
        }
    });

    /**
     * Controller for project list as cards
     */
    module.controller('ProjectCardViewController', function () {
        "ngInject";

    });
})();
