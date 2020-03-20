/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    /**
     * Register an project type for ui-router
     */
    module.config(function (ResourceUrlTypeFactoryServiceProvider) {
        'ngInject';

        /**
         * Project type definition
         */
        ResourceUrlTypeFactoryServiceProvider.registerType(
            'project',
            /[a-fA-F\d]{8}-(?:[a-fA-F\d]{4}-){3}[a-fA-F\d]{12}/,
            'pk',
            function ($pk, ProjectRestService) {
                'ngInject';

                // get project
                return ProjectRestService.getCached({pk: $pk});
            },
            // needs authentication
            true
        );
    });
})();
