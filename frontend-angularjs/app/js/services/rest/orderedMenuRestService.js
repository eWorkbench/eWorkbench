/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/menu_entries using ngResource
     */
    module.factory('OrderedMenuRestService', function ($injector, $resource, $state, restApiUrl) {
        'ngInject';

        /**
         * Fill state information for a menu entry
         * this is accomplished by using $injector and calling state.title and state.icon (if available)
         * @param entry
         */
        var fillStateInfoForMenuEntry = function (entry) {
            var state = $state.get(entry.route);

            if (state) {
                var params = {};

                for (var j = 0; j < entry.menu_entry_parameters.length; j++) {
                    var param = entry.menu_entry_parameters[j];

                    params[param.name] = param.value;
                }

                // check state.title and call $injector
                if (state.title) {
                    entry.title = $injector.invoke(state.title, null, {'$queryParams': params});
                } else {
                    entry.title = "No Name (" + entry.route + ")";
                }

                // check state.icon and call $injector
                if (state.icon) {
                    entry.icon = $injector.invoke(state.icon, null, {'$queryParams': params});
                } else {
                    entry.icon = "";
                }

                entry.url = $state.href(entry.route, params);

                /**
                 * Calculate Width of element by adding it to menu-entries-dnd
                 */

                // create a fake jquery DOM element and append it to body
                var el = jQuery('<li class="menu-entry"><a><i class="' + entry.icon + '"></i> ' + entry.title + '</a></li>');

                el.css({
                    'visibility': 'hidden',
                    'position': 'absolute',
                    'font-size': '12pt !important'
                });
                el.appendTo('.menu-entries-dnd');

                // determine width
                entry.width = el.width();

                // and remove the element again
                el.remove();
            } else {
                entry.visible = false;
                console.log("Unknown Route " + entry.route);
            }
        };

        var transformResponseForMenuEntry = function (data, headersGetter, status) {
            var menuEntry = angular.fromJson(data);

            if (status === undefined || (status >= 200 && status < 300)) {
                fillStateInfoForMenuEntry(menuEntry);
            }

            return menuEntry;
        };

        var transformResponseForMenuEntryArray = function (data, headersGetter) {
            var list = angular.fromJson(data);

            for (var i = 0; i < list.length; i++) {
                fillStateInfoForMenuEntry(list[i]);
            }

            return list;
        };

        // create ng-resource for api endpoint /api/meetings, with parameter meetings id
        return $resource(
            restApiUrl + 'menu_entries/:pk/',
            {pk: '@pk'},
            {
                'create': {
                    'method': 'POST',
                    transformResponse: transformResponseForMenuEntry
                },
                'update': {
                    'method': 'PUT',
                    transformResponse: transformResponseForMenuEntry
                },
                'updatePartial': {
                    'method': 'PATCH',
                    transformResponse: transformResponseForMenuEntry
                },
                'get': {
                    'method': 'GET',
                    transformResponse: transformResponseForMenuEntry
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    transformResponse: transformResponseForMenuEntryArray
                },
                'updateOrdering': {
                    'method': 'PUT',
                    'isArray': true,
                    'url': restApiUrl + 'menu_entries/update_ordering/',
                    transformResponse: transformResponseForMenuEntryArray
                }
            }
        );
    });
})();
