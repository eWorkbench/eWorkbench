/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A widget soft delete and restore icons
     */
    module.directive('genericListLoadingWidget', function () {
        return {
            'restrict': 'E',
            'controller': 'GenericListLoadingWidgetController',
            'templateUrl': 'js/widgets/genericListLoadingWidget/genericListLoadingWidget.html',
            'bindToController': true,
            'controllerAs': 'vm',
            'scope': {
                'loadingFlag': '<',
                'loadingText': '@'
            }
        };
    });

    module.controller('GenericListLoadingWidgetController', function () {
        "ngInject";
    });
})();
