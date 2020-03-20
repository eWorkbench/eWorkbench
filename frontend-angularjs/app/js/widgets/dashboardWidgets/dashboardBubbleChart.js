/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('dashboardBubbleChart', {
        templateUrl: 'js/widgets/dashboardWidgets/dashboardBubbleChart.html',
        controller: 'DashboardBubbleChartController',
        controllerAs: 'vm',
        bindings: {
            data: '<',
            isLoading: '<'
        },
        bindToController: true
    });

    /**
     * Dashboard Activity Controller
     *
     * Displays the dashboard activity overview
     */
    module.controller('DashboardBubbleChartController', function (gettextCatalog, $scope) {
        'ngInject';

    });
})();
