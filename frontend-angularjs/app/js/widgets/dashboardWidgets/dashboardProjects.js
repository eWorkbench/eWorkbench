/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('dashboardProjects', {
        templateUrl: 'js/widgets/dashboardWidgets/dashboardProjects.html',
        controller: 'DashboardProjectsController',
        controllerAs: 'vm',
        bindings: {
            projects: '<',
            isLoading: '<'
        },
        bindToController: true
    });

    /**
     * Main Controller
     *
     * Displays the mainDashboard overview page
     */
    module.controller('DashboardProjectsController', function (
        IconImagesService,
        projectCreateModalService
    ) {
        'ngInject';

        var
            vm = this;

        vm.projectIcon = IconImagesService.mainElementIcons.project;

        vm.createNewProject = function () {
            var modal = projectCreateModalService.open();

            modal.result.then(projectCreateModalService.viewElement);
        };
    });
})();
