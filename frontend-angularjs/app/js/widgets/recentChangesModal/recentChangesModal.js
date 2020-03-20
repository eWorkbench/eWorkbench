/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Service for creating a recent changes (history) modal dialog
     */
    module.factory('recentChangesModalService', function (
        $uibModal
    ) {
        var service = {};

        service.open = function (workbenchElement) {
            return $uibModal.open({
                templateUrl: 'js/widgets/recentChangesModal/recentChangesModal.html',
                controller: 'RecentChangesModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    'workbenchElement': function () {
                        return workbenchElement;
                    }
                }
            });
        };

        return service;
    });

    module.controller('RecentChangesModalController', function (
        $scope,
        $uibModalInstance,
        WorkbenchElementsTranslationsService,
        toaster,
        gettextCatalog,
        workbenchElement
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * The workbench element that the notes are displayed for
             * @type {workbenchElement|*}
             */
            vm.workbenchElement = workbenchElement;

            /**
             * Name of the workbench element model
             */
            vm.workbenchElementModelName =
                WorkbenchElementsTranslationsService.contentTypeToModelName[workbenchElement.content_type_model];

        };

        vm.close = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
