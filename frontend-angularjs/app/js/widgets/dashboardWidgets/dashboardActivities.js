/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('dashboardActivities', {
        templateUrl: 'js/widgets/dashboardWidgets/dashboardActivities.html',
        controller: 'DashboardActivitiesController',
        controllerAs: 'vm',
        bindings: {
            histories: '<',
            isLoading:'<'
        },
        bindToController: true
    });

    /**
     * Dashboard Activity Controller
     *
     * Displays the dashboard activity overview
     */
    module.controller('DashboardActivitiesController', function (
        HistoryModelTypeService,
        IconImagesService,
        WorkbenchElementsTranslationsService
    ) {
        'ngInject';

        var
            vm = this;

        vm.activityIcon = IconImagesService.genericIcons.history;

        /** get all model types */
        vm.modelTypes = WorkbenchElementsTranslationsService.contentTypeToModelName;

        vm.historyChangeText = HistoryModelTypeService.historyChangeText;
    });
})();
