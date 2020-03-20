/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    /**
     * Register a contact type for ui-router
     */
    module.config(function (ResourceUrlTypeFactoryServiceProvider) {
        'ngInject';

        /**
         * Note Type definition
         */
        ResourceUrlTypeFactoryServiceProvider.registerType(
            'contact',
            /[a-fA-F\d]{8}-(?:[a-fA-F\d]{4}-){3}[a-fA-F\d]{12}/,
            'pk',
            function ($pk, ContactRestService) {
                'ngInject';

                // query with project and contact
                return ContactRestService.getCached({pk: $pk});
            },
            // needsAuth
            true
        );
    });
})();
