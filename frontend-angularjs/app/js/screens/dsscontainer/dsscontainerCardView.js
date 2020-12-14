/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * DSSContainer List as cards
     */
    module.component('dsscontainerCardView', {
        templateUrl: 'js/screens/dsscontainer/dsscontainerCardView.html',
        controller: 'DSSContainerCardViewController',
        controllerAs: 'vm',
        bindings: {
            'dsscontainers': '<',
            'searchField': '<'
        }
    });

    /**
     * Controller for dsscontainers list as cards
     */
    module.controller('DSSContainerCardViewController', function () {
        "ngInject";
    });
})();
