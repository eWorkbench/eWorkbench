/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * This is a skeleton service to fit the existing project structure
     * it's sole purpose is to provide globalSearchWidget with a getViewUrl-function
     */
    module.service('plugininstanceCreateModalService', function (
        $state
    ) {
        var service = {};

        /**
         * Return the URL of the supplied element
         * @param plugininstance
         * @returns {string} the url
         */
        service.getViewUrl = function (plugininstance) {
            return $state.href("plugininstance-view", {plugininstance: plugininstance });
        };

        return service;
    });
})();
