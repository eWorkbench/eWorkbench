/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Picture List as cards
     */
    module.component('plugininstanceCardView', {
        templateUrl: 'js/screens/plugin/plugininstanceCardView.html',
        controller: 'PlugininstanceCardViewController',
        controllerAs: 'vm',
        bindings: {
            'plugininstances': '<',
            'searchField': '<'
        }
    });

    /**
     * Controller for plugin instance list as cards
     */
    module.controller('PlugininstanceCardViewController', function () {
        "ngInject";
    });
})();
