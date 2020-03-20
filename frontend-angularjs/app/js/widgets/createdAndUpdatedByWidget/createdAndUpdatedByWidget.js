/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    /**
     * A directive which takes any element and displays this elements created_by, created_at, updated_by and updated_at
     * attributes
     */
    module.directive('createdAndUpdatedByWidget', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/createdAndUpdatedByWidget/createdAndUpdatedByWidget.html',
            controller: 'CreatedAndUpdatedByWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                element: '=?'
            }
        }
    });

    module.controller('CreatedAndUpdatedByWidgetController', function () {
        'ngInject';
    });

})();
