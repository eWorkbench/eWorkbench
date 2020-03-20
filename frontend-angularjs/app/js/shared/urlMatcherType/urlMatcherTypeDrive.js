/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    /**
     * Register a file type for ui-router
     */
    module.config(function (ResourceUrlTypeFactoryServiceProvider) {
        'ngInject';

        /**
         * Drive Type definition
         */
        ResourceUrlTypeFactoryServiceProvider.registerType(
            'drive',
            /[a-fA-F\d]{8}-(?:[a-fA-F\d]{4}-){3}[a-fA-F\d]{12}/,
            'pk',
            function ($pk, DriveRestService) {
                'ngInject';

                // query file
                return DriveRestService.getCached({pk: $pk});
            },
            // needsAuth
            true
        );
    });
})();
