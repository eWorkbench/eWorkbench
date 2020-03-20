/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('services');

    /**
     * Provides functionality for resource selectize widgets.
     */
    module.service('ResourceSelectizeWidgetHelperService', function (
        ResourceRestService,
        $timeout,
        UserNameService
    ) {
        'ngInject';

        var service = {};

        /**
         * Returns the rendered html for the resource options in the resource selectize widgets
         * @param resource
         * @param escape
         */
        service.renderResource = function (item, escape) {
            var str = '<div>';

            str += '<span>' + escape(item.name) + '</span></br>';

            if (item.availability) {
                str += '<span class="availability-display">' + escape(item.availability) + '</span><br />';
            }

            if (item.location && item.location !== '') {
                str += '<span class="description-display">' + escape(item.location) + '</span> '
                    + '</div>';
            }

            return str;
        };

        /**
         * Returns the rendered html for the selected resource in the resource selectize widgets
         * @param resource
         * @param escape
         */
        service.renderSelectedResource = function (item, escape) {
            if (item.location && item.location !== '') {
                return '<div>'
                    + '<span>' + escape(item.name) + '</span>'
                    + '<span class="description-display"> (' + escape(item.location) + ')</span>'
                    + '</div>';
            }

            return '<div>'
                + '<span>' + escape(item.name) + '</span>'
                + '</div>';
        };

        /**
         * Calls querys to the API on search
         * @param vm
         * @param query
         * @param callback
         */
        service.queryOnSearch = function (vm, query, callback) {
            // check if query contains anything
            if (!query.length || query.length < 2) {
                // minimum of two characters before we fire a query to rest API
                return callback();
            }

            // query rest API - on success, we use callback with the response array
            return service.searchResourceViaRest(query).$promise.then(
                function success (response) {
                    callback(response.results);
                },
                function error (rejection) {
                    console.log("Error querying resource search endpoint");
                    console.log(rejection);
                    callback();
                }
            )
        };

        /**
         * Querys the API
         * @param searchValue
         */
        service.searchResourceViaRest = function (searchValue) {
            return ResourceRestService.resource.search({search: searchValue});
        };

        /**
         * Initialises the selectize widget
         * @param vm
         * @param selectize
         */
        service.init = function (vm, selectize) {
            // store selectize element
            vm.selectize = selectize;

            // check for readonly (needs to be done in next digest cycle)
            $timeout(function () {
                if (vm.ngReadonly) {
                    selectize.lock();
                }
            });

            // activate plugin: on enter key press, emit an onSubmit event
            selectize.on('enter', function () {
                // submit the form in the next Digest Cycle (yay AngularJS)
                $timeout(function () {
                    selectize.$input.closest("form").submit();
                });
            });
        };

        return service;
    });
})();
