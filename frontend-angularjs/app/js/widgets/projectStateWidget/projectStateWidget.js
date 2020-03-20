/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * A directive which displays a project state
     */
    module.directive('projectStateWidget', function () {
        return {
            templateUrl: 'js/widgets/projectStateWidget/projectStateWidget.html',
            controller: 'ProjectStateWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                projectState: '='
            }
        }
    });

    module.controller('ProjectStateWidgetController', function (ProjectStateService) {
        'ngInject';

        var vm = this;

        vm.ProjectStateService = ProjectStateService;
    });
})();
