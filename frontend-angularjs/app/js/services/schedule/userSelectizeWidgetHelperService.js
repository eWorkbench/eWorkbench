/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('services');

    /**
     * Provides functionality for user selectize widgets.
     */
    module.service('UserSelectizeWidgetHelperService', function (
        UserRestService,
        $timeout,
        UserNameService
    ) {
        'ngInject';

        var service = {};

        /**
         * Returns the rendered html for the user options in the user selectize widgets
         * @param user
         * @param escape
         */
        service.renderUser = function (user, escape) {
            var html = '<div class="row">';

            html += '<div class="col-xs-2" style="width: 50px">';
            if (user.userprofile) {
                html += '<img src="' + escape(user.userprofile.avatar) + '" class="img img-responsive" alt="">';
            }
            html += '</div>';

            html += '<div class="col-xs-10" style="width: calc(100% - 60px)">';
            html += '<span>';
            html += escape(UserNameService.getFullNameOrUsername(user));
            html += '</span>';

            html += '<br/>';
            if (user.email) {
                html += '<span class="email-display">' + escape(user.email) + '</span>';
            } else {
                // add space to make it look like entries with an email address
                html += '&nbsp;';
            }

            html += '</div></div>';

            return html;
        };

        /**
         * Returns the rendered html for the selected user in the user selectize widgets
         * @param user
         * @param escape
         */
        service.renderSelectedUser = function (user, escape) {
            var html = '<span>';

            html += escape(UserNameService.getFullNameOrUsername(user));
            html += '</span>';

            if (user.email) {
                html += ' ';
                html += '<span class="email-display">' + escape(user.email) + '</span>';
            }

            return '<div>' + html + '</div>';
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
            return service.searchUserViaRest(query).$promise.then(
                function success (response) {
                    callback(response);
                },
                function error (rejection) {
                    console.log("Error querying user search endpoint");
                    console.log(rejection);
                    callback();
                }
            )
        };

        /**
         * Calls querys to the API on search for calendar access privileges
         * @param vm
         * @param accessUserPk
         * @param accessEditable
         * @param query
         * @param callback
         */
        service.queryAccessOnSearch = function (vm, accessUserPk, accessEditable, query, callback) {
            // check if query contains anything
            if (!query.length || query.length < 2) {
                // minimum of two characters before we fire a query to rest API
                return callback();
            }

            // query rest API - on success, we use callback with the response array
            return service.searchAccessUserViaRest(accessUserPk, accessEditable, query).$promise.then(
                function success (response) {
                    callback(response);
                },
                function error (rejection) {
                    console.log("Error querying user search endpoint");
                    console.log(rejection);
                    callback();
                }
            )
        };

        /**
         * Querys the API
         * @param searchValue
         */
        service.searchUserViaRest = function (searchValue) {
            return UserRestService.resource.search({search: searchValue});
        };

        /**
         * Querys the API with the access flag
         * @param accessUserPk
         * @param accessEditable
         * @param searchValue
         */
        service.searchAccessUserViaRest = function (accessUserPk, accessEditable, searchValue) {
            return UserRestService.resource.search({
                access_user: accessUserPk,
                access_editable: accessEditable,
                search: searchValue
            });
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
