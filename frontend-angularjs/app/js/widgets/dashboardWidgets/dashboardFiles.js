/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('dashboardFiles', {
        templateUrl: 'js/widgets/dashboardWidgets/dashboardFiles.html',
        controller: 'DashboardFilesController',
        controllerAs: 'vm',
        bindings: {
            files: '<',
            isLoading: '<'
        },
        bindToController: true
    });

    /**
     * Main Controller
     *
     * Displays the mainDashboard overview page
     */
    module.controller('DashboardFilesController', function (
        AuthRestService,
        FileIconService,
        IconImagesService,
        fileCreateModalService
    ) {
        'ngInject';

        var
            vm = this;

        vm.user = null;

        vm.fileIcon = IconImagesService.mainElementIcons.file;

        vm.getFileTypeIcon = FileIconService.getFileTypeIcon;

        vm.createNewFile = function () {
            var modal = fileCreateModalService.open();

            modal.result.then(fileCreateModalService.viewElement);
        };

        AuthRestService.getCurrentUser().$promise.then(
            function (user) {
                vm.user = user;
            }
        );
    });
})();
