/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/kanbanboards using cachedResource
     */
    module.factory('KanbanboardRestService', function (
        cachedResource,
        restApiUrl,
        userCacheService,
        PaginationCountHeader
    ) {
        'ngInject';

        /**
         * Transform Content Type Header to "undefined" if "background_image" is set
         * @param request
         * @returns {*}
         */
        var transformContentTypeHeader = function (request) {
            if (request && request.data && request.data.background_image) {
                return undefined;
            }

            return "application/json;charset=UTF-8";
        };


        /**
         * Transforms the "request" into a formdata object, if the content contains the "path" attribute
         * @param data
         * @returns {*}
         */
        var transformKanbanRequest = function (data, headers) {
            if (data === undefined) {
                return data;
            }

            if (data.background_image !== undefined && data.background_image != "") {
                var fd = new FormData();

                angular.forEach(data, function (value, key) {
                    if (value instanceof FileList) {
                        // formdata with file content
                        if (value.length == 1) {
                            fd.append(key, value[0]);
                        } else {
                            angular.forEach(value, function (file, index) {
                                fd.append(key + '_' + index, file);
                            });
                        }
                    } else if (value instanceof Array) {
                        // for arrays, we need to deconstruct the array (for form-data to work)
                        for (var i = 0; i < value.length; i++) {
                            fd.append(key, value[i]);
                        }
                    } else {
                        // any other key
                        fd.append(key, value);
                    }
                });

                return fd;
            }

            return angular.toJson(data);
        };

        /**
         * add project_pk to the picture
         * @param picture
         * @returns {*}
         */
        var convertKanbanFromRestApi = function (kanban) {
            if (kanban.created_by) {
                userCacheService.addUserToCache(kanban.created_by);
            }
            if (kanban.last_modified_by) {
                userCacheService.addUserToCache(kanban.last_modified_by);
            }

            return kanban;
        };

        var transformResponseForKanbanArray = function (data, headers) {
            var list = angular.fromJson(data);

            headers()[PaginationCountHeader.getHeaderName()] = list.count;

            if (list.results) {
                for (var i = 0; i < list.results.length; i++) {
                    convertKanbanFromRestApi(list.results[i]);
                }
            } else {
                for (var j = 0; j < list.length; j++) {
                    convertKanbanFromRestApi(list[j]);
                }

                return list;
            }

            return list.results;
        };

        var transformResponseForKanban = function (data, headersGetter) {
            var kanban = angular.fromJson(data);

            return convertKanbanFromRestApi(kanban);
        };

        return cachedResource(
            restApiUrl + 'kanbanboards/:pk/',
            {pk: '@pk', project: '@filter_by_project_pk'},
            {
                'options': {
                    'method': 'OPTIONS',
                    'cancellable': true
                },
                'search': {
                    'ignoreLoadingBar': true,
                    'method': 'GET',
                    'cancellable': true,
                    'isArray': true,
                    'transformResponse': transformResponseForKanbanArray
                },
                'create': {
                    method: 'POST',
                    transformRequest: transformKanbanRequest,
                    'transformResponse': transformResponseForKanban,
                    headers: {
                        'Content-Type': transformContentTypeHeader
                    }
                },
                'update': {
                    method: 'PUT',
                    transformRequest: transformKanbanRequest,
                    'transformResponse': transformResponseForKanban,
                    headers: {
                        'Content-Type': transformContentTypeHeader
                    }
                },
                'updatePartial': {
                    method: 'PATCH',
                    transformRequest: transformKanbanRequest,
                    headers: {
                        'Content-Type': transformContentTypeHeader
                    }
                },
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': transformResponseForKanbanArray,
                    'interceptor': {
                        response: function (response) {
                            response.resource.$httpHeaders = response.headers;

                            return response.resource;
                        }
                    }
                },
                'get': {
                    'method': 'GET',
                    'transformResponse': transformResponseForKanban
                },
                'softDelete': {
                    'url': restApiUrl + 'kanbanboards/:pk/soft_delete/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForKanban
                },
                'restore': {
                    'url': restApiUrl + 'kanbanboards/:pk/restore/',
                    'method': 'PATCH',
                    'isArray': false,
                    'transformResponse': transformResponseForKanban
                },
                'clearBackgroundImage': {
                    'url': restApiUrl + 'kanbanboards/:pk/clear_background_image/',
                    'method': 'PATCH',
                    'isArray': false
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: true,
                relatedCaches: []
            }
        );
    });

    /**
     * Service that provides a list of kanbanboard column icons
     */
    module.service('KanbanboardColumnIconService', function () {
        "ngInject";

        var service = {},
            // see backend model for choices: app/eric/kanban_boards/models/models.py
            // choices are hard-coded here, because options requests are not allowed on the live systems
            icons = [
                {"display_name": "New", "value": "fa fa-star"},
                {"display_name": "In Progress", "value": "fa fa-spinner"},
                {"display_name": "Done", "value": "fa fa-check"},
                {"display_name": "Paused", "value": "fa fa-pause"},
                {"display_name": "Canceled", "value": "fa fa-times"},
                {"display_name": "Documentation", "value": "fa fa-book"},
                {"display_name": "Delivery", "value": "fa fa-truck"},
                {"display_name": "ToDo", "value": "fa fa-bars"},
                {"display_name": "Testing", "value": "fa fa-bolt"},
                {"display_name": "Decision required", "value": "fa fa-code-fork"},
                {"display_name": "Flask", "value": "fa fa-flask"},
                {"display_name": "Question", "value": "fa fa-question"}
            ];

        service.getIcons = function () {
            return icons;
        };

        return service;
    });

    /**
     * Define API Endpoint for Querying all kanban board columns of a task
     */
    module.service('TaskKanbanboardColumnRestService', function (
        $resource,
        $state,
        restApiUrl
    ) {
        "ngInject";

        return function (taskPk) {
            return $resource(
                restApiUrl + 'tasks/' + taskPk + '/kanbanboard_assignments/:pk/',
                {pk: '@pk'},
                {
                    'query': {
                        'isArray': true,
                        'transformResponse': function (data) {
                            var arr = angular.fromJson(data);

                            for (var i = 0; i < arr.length; i++) {
                                arr[i].kanbanBoardDetailViewUrl = $state.href(
                                    "kanbanboard-view", {kanbanboard: arr[i].kanban_board}
                                );
                            }

                            return arr;
                        }
                    }
                }
            );
        };
    });


    /**
     * Define API Endpoint for Tasks of a kanbanboard /api/kanbanboards/:kanbanboard_pk/tasks/:pk/
     */
    module.service('KanbanboardColumnTaskAssignmentRestService', function (
        cachedResource,
        restApiUrl,
        TaskConverterService
    ) {
        'ngInject';

        var transformAssignmentArray = function (data) {
            var arr = angular.fromJson(data);

            for (var i = 0; i < arr.length; i++) {
                arr[i].task = TaskConverterService.convertTaskFromRestAPI(arr[i].task);
            }

            return arr;
        };


        return function (kanbanboardPk) {
            return cachedResource(
                restApiUrl + 'kanbanboards/' + kanbanboardPk + '/tasks/:pk/',
                {pk: '@pk'},
                {
                    'query': {
                        'method': 'GET',
                        'isArray': true,
                        'transformResponse': transformAssignmentArray
                    },
                    'moveAssignment': {
                        'url': restApiUrl + 'kanbanboards/' + kanbanboardPk + '/tasks/move_assignment/',
                        'method': 'PUT',
                        'isArray': true
                    },
                    'createMany': {
                        'url': restApiUrl + 'kanbanboards/' + kanbanboardPk + '/tasks/create_many/',
                        'method': 'POST',
                        'isArray': true
                    }
                },
                {
                    keyName: 'pk',
                    cacheTimeoutInSeconds: 5, // seconds
                    invalidateCacheOnUpdates: false,
                    invalidateCacheOnInsert: false,
                    relatedCaches: []
                }
            );
        };
    });
})();
