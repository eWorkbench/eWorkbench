/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        app = angular.module('app');

    // define rest api url
    app.value('djangoAdminUrl', '/admin/');
    app.value('restApiUrl', '/api/');
    app.value('apiDateConfig', 'YYYY-MM-DD HH:mm:ss Z');
    app.value('websocketsUrl', 'ws://localhost:8000/ws/');


    app.config(function () {
        'ngInject';

        console.log('Configuring app');
    });
})();
