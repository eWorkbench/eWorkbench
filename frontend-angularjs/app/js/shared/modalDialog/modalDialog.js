/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('shared');

    module.directive('modalDialog', function () {
        return {
            restrict: 'C',
            link: function (scope, elem, attr) {
                elem.draggable({
                    handle: ".modal-header"
                });
            }
        }
    });

})();
