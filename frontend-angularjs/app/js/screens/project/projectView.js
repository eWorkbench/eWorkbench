/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Shows the overall project data.
     */
    module.component('projectView', {
        templateUrl: 'js/screens/project/projectView.html',
        controller: 'ProjectViewController',
        controllerAs: 'vm',
        bindings: {
            'project': '='
        }
    });

    /**
     * Controller for project overview screen component.
     */
    module.controller('ProjectViewController', function (
        ProjectSidebarService,
        IconImagesService,
        $scope,
        $timeout
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.projectIcon = IconImagesService.mainElementIcons.project;

            ProjectSidebarService.project = vm.project;

            vm.isReadOnly = false;
        };

        // is triggered when the readonly state is changed to true
        // in a save in app/js/screens/project/overviewProject.js
        $scope.$on('project-isReadOnly', function () {
            $timeout(function () {
                vm.isReadOnly = true;
            });
        });

        // is triggered when the readonly state is changed to false
        // in a save in app/js/screens/project/overviewProject.js
        $scope.$on('project-isNotReadOnly', function () {
            $timeout(function () {
                vm.isReadOnly = false
            });
        });
    });
})();
