/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    /**
     * Register a task type for ui-router
     */
    module.config(function (ResourceUrlTypeFactoryServiceProvider) {
        'ngInject';

        /**
         * Task Type definition
         */
        ResourceUrlTypeFactoryServiceProvider.registerType(
            'task',
            /[a-fA-F\d]{8}-(?:[a-fA-F\d]{4}-){3}[a-fA-F\d]{12}/,
            'pk',
            function ($pk, TaskRestService) {
                'ngInject';

                // query with project and task
                return TaskRestService.getCached({pk: $pk});
            },
            // needsAuth
            true
        );
    });
})();
