/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for reading and writing filter states
     */
    module.factory('FilterUrlStateService', function ($state) {
        'ngInject';

        var timeoutForRefreshingState = null;

        var refreshStateOptionsInUrl = function () {
            // update filter params of current state
            $state.transitionTo($state.current.name, $state.params, {nofity: false});
        };


        var service = {
            setFilterOption: function (key, value) {
                $state.params[key] = value;

                if (timeoutForRefreshingState) {
                    window.clearTimeout(timeoutForRefreshingState);
                }

                timeoutForRefreshingState = window.setTimeout(refreshStateOptionsInUrl, 25);
            }
        };

        return service;
    });

})();
