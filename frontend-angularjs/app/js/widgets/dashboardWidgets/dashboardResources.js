/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('dashboardResources', {
        templateUrl: 'js/widgets/dashboardWidgets/dashboardResources.html',
        controller: 'DashboardResourcesController',
        controllerAs: 'vm',
        bindings: {
            resources: '<',
            isLoading: '<'
        },
        bindToController: true
    });

    /**
     * Main Controller
     *
     * Displays the mainDashboard overview page
     */
    module.controller('DashboardResourcesController',
        function (
            IconImagesService,
            resourceCreateModalService
        ) {
            'ngInject';
            var vm = this;

            vm.resourceIcon = IconImagesService.mainElementIcons.resource;

            vm.createNewResource = function () {
                var modal = resourceCreateModalService.open();

                modal.result.then(resourceCreateModalService.viewElement);
            };
        });

    /**
     * A filter that converts html to plaintext, so also truncate can work on it
     */
    module.filter('htmlToPlaintext', function () {
        return function (text) {
            return text ? String(text).replace(/<[^>]+>/gm, '') : '';
        };
    });
})();
