/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('services');

    /**
     * Define API Endpoint for /api/contacts using ngResource
     */
    module.factory('ContactRestService', function (
        cachedResource,
        restApiUrl,
        userCacheService,
        PaginationCountHeader
    ) {
        'ngInject';

        var transformResponseForContactArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    convertContactFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    convertContactFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };

        var transformResponseForContact = function (data, headersGetter) {
            var contact = angular.fromJson(data);

            if (contact.created_by) {
                userCacheService.addUserToCache(contact.created_by);
            }
            if (contact.last_modified_by) {
                userCacheService.addUserToCache(contact.last_modified_by);
            }

            return convertContactFromRestAPI(contact);
        };

        /**
         * add project_pk to the contact
         * @param contact
         * @returns {*}
         */
        var convertContactFromRestAPI = function (contact) {
            contact.project_pk = contact.project;

            return contact;
        };

        // create cached ng-resource for api endpoint /api/project/pk/contacts
        return cachedResource(
            restApiUrl + 'contacts/:pk/',
            {pk: '@pk', project: '@filter_by_project_pk', userPk: '@userPk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancelable': true,
                    'isArray': true,
                    'transformResponse': transformResponseForContactArray
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': transformResponseForContact
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': transformResponseForContactArray,
                    'interceptor': {
                        response: function (response) {
                            response.resource.$httpHeaders = response.headers;

                            return response.resource;
                        }
                    }
                },
                'softDelete': {
                    'url': restApiUrl + 'contacts/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForContactArray
                },
                'restore': {
                    'url': restApiUrl + 'contacts/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForContactArray
                },
                'share': {
                    'url': restApiUrl + 'sharecontact/',
                    'method': 'POST',
                    'isArray': false
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: true,
                relatedCaches: []
            });
    });
})();
