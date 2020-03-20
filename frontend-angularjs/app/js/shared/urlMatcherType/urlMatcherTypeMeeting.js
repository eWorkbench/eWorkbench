/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    /**
     * Register a meeting type for ui-router
     */
    module.config(function (ResourceUrlTypeFactoryServiceProvider) {
        'ngInject';

        /**
         * Meeting Type definition
         */
        ResourceUrlTypeFactoryServiceProvider.registerType(
            'meeting',
            /[a-fA-F\d]{8}-(?:[a-fA-F\d]{4}-){3}[a-fA-F\d]{12}/,
            'pk',
            function ($pk, MeetingRestService) {
                'ngInject';

                // query contact
                return MeetingRestService.getCached({pk: $pk});
            },
            // needsAuth
            true
        );
    });
})();
/**
 * Created by thochegger on 19.12.16.
 */
