/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing task type info
     */
    module.factory('TaskConverterService', function (gettextCatalog, userCacheService, PaginationCountHeader) {
        'ngInject';

        var service = {
            // define task types and colors for progress bar
            'taskStates': {
                'NEW': 'task-color-new',
                'PROG': 'task-color-in-progress',
                'DONE': 'task-color-finish'
            },
            // define default order of tasks
            'taskStateOrder': [
                'NEW',
                'PROG',
                'DONE'
            ],
            'taskStateNumbers': {
                'NEW': -10,
                'PROG': 0,
                'DONE': +10
            },
            'taskStateImages': {
                'NEW': 'fa fa-star',
                'PROG': 'fa fa-spinner',
                'DONE': 'fa fa-check'
            },
            'taskStateTexts': {
                'NEW': gettextCatalog.getString('New'),
                'PROG': gettextCatalog.getString('In Progress'),
                'DONE': gettextCatalog.getString('Done')
            },
            'taskPriorityImages': {
                'VHIGH': 'fa fa-angle-double-up',
                'HIGH': 'fa fa-angle-up',
                'NORM': '',
                'LOW': 'fa fa-angle-down',
                'VLOW': 'fa fa-angle-double-down'
            },
            'taskPriorityTexts': {
                'VHIGH': gettextCatalog.getString('Very High'),
                'HIGH': gettextCatalog.getString('High'),
                'NORM': gettextCatalog.getString('Normal'),
                'LOW': gettextCatalog.getString('Low'),
                'VLOW': gettextCatalog.getString('Very Low')
            },
            'taskPriorityNumbers': {
                'VHIGH': 10,
                'HIGH': 5,
                'NORM': 0,
                'LOW': -5,
                'VLOW': -10
            },
            /**
             * Adds priority_as_number and state_as_number to the task
             * @param task
             * @returns {task}
             */
            'convertTaskFromRestAPI': function (task) {
                // do not convert objects that do not contain an actual task
                // this is the case when rest api throws an error
                if (!task.pk) {
                    return task;
                }

                var i = 0;

                task.priority_as_number = service.taskPriorityNumbers[task.priority];
                task.state_as_number = service.taskStateNumbers[task.state];
                task.project_pk = task.project;
                task.due_date = (task.due_date ? moment(task.due_date) : null);
                task.start_date = (task.start_date ? moment(task.start_date) : null);

                task.start = task.start_date;
                task.end = task.due_date;

                if (task.created_by) {
                    userCacheService.addUserToCache(task.created_by);
                }
                if (task.last_modified_by) {
                    userCacheService.addUserToCache(task.last_modified_by);
                }
                if (task.assigned_user) {
                    userCacheService.addUserToCache(task.assigned_user);
                }
                if (task.assigned_users) {
                    for (i = 0; i < task.assigned_users.length; i++) {
                        userCacheService.addUserToCache(task.assigned_users[i]);
                    }
                }

                return task;
            },
            'transformResponseForTaskArray': function (data, headers) {
                var list = angular.fromJson(data);

                headers()[PaginationCountHeader.getHeaderName()] = list.count;

                if (list.results) {
                    for (var i = 0; i < list.results.length; i++) {
                        service.convertTaskFromRestAPI(list.results[i]);
                    }
                } else {
                    for (var j = 0; j < list.length; j++) {
                        service.convertTaskFromRestAPI(list[j]);
                    }

                    return list;
                }

                return list.results;
            },
            'transformResponseForTask': function (data, headersGetter, status) {
                var task = angular.fromJson(data);

                // do not convert the response if the status code is an error (e.g., 40x)
                if (status === undefined || (status >= 200 && status < 300)) {
                    return service.convertTaskFromRestAPI(task);
                }

                return task;
            }
        };

        return service;
    });

})();
