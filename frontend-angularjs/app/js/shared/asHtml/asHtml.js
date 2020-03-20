/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    module.filter('asHtml', function ($sce) {
        'ngInject';

        return function (htmlCode) {
            return $sce.trustAsHtml(htmlCode);
        }
    });
})();
