/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('dashboardTasks', {
        templateUrl: 'js/widgets/dashboardWidgets/dashboardTasks.html',
        controller: 'DashboardTasksController',
        controllerAs: 'vm',
        bindings: {
            tasks: '<',
            isLoading: '<'
        },
        bindToController: true
    });

    /**
     * Dashboard Tasks Controller
     *
     * Displays Tasks in the Main Dashboard
     */
    module.controller('DashboardTasksController', function (
        IconImagesService,
        taskCreateModalService
    ) {
        'ngInject';

        var
            vm = this;

        vm.today = moment();

        vm.taskIcon = IconImagesService.mainElementIcons.task;

        vm.createNewTask = function () {
            var modal = taskCreateModalService.open();

            modal.result.then(taskCreateModalService.viewElement);
        };
    });
})();
