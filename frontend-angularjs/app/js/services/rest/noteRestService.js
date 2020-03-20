/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/notes using ngResource
     */
    module.factory('NoteRestService', function (
        cachedResource,
        restApiUrl,
        userCacheService,
        PaginationCountHeader
    ) {
        'ngInject';

        var transformResponseForNoteArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    convertNoteFromRestAPI(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    convertNoteFromRestAPI(list[j]);
                }

                return list;
            }

            return list.results;
        };
        var transformResponseForNote = function (data, headersGetter) {
            var note = angular.fromJson(data);


            return convertNoteFromRestAPI(note);
        };
        /**
         * add project_pk to the note
         * @param note
         * @returns {*}
         */
        var convertNoteFromRestAPI = function (note) {
            note.project_pk = note.project;

            if (note.created_by) {
                userCacheService.addUserToCache(note.created_by);
            }
            if (note.last_modified_by) {
                userCacheService.addUserToCache(note.last_modified_by);
            }

            return note;
        }

        // create cached ng-resource for api endpoint /api/project/pk/notes
        return cachedResource(
            restApiUrl + 'notes/:pk/',
            {pk: '@pk', project: '@filter_by_project_pk'},
            {
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': transformResponseForNoteArray
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': transformResponseForNote
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': transformResponseForNoteArray,
                    'interceptor': {
                        response: function (response) {
                            response.resource.$httpHeaders = response.headers;

                            return response.resource;
                        }
                    }
                },
                'delete': {
                    'method': 'DELETE',
                    'isArray': false
                },
                'softDelete': {
                    'url': restApiUrl + 'notes/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForNoteArray
                },
                'restore': {
                    'url': restApiUrl + 'notes/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForNoteArray
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
