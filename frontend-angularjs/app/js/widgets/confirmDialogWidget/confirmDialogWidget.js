/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('shared');

    /**
     * Service for creating a confirm modal dialog
     */
    module.service('confirmDialogWidget', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @returns {$uibModalInstance}
         */
        service.open = function (modalData) {
            return $uibModal.open({
                templateUrl: 'js/widgets/confirmDialogWidget/confirmDialogWidget.html',
                controller: 'ConfirmDialogWidgetController',
                controllerAs: 'vm',
                resolve: {
                    modalData: function () {
                        return modalData;
                    }
                }
            });
        };

        return service;
    });

    module.controller('ConfirmDialogWidgetController', function (
        $uibModalInstance,
        $timeout,
        confirmDialogService,
        modalData
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.title = modalData.title;
            vm.message = modalData.message;
            vm.okButtonText = modalData.okButtonText;
            vm.cancelButtonText = modalData.cancelButtonText;

            vm.doNotShowMessageAgain = false;
            vm.dialogKey = modalData.dialogKey;
            vm.defaultAction = modalData.defaultAction;
            if (vm.defaultAction === undefined) {
                vm.defaultAction = true;
            }

            if (vm.getSkipDialogSetting()) {
                console.log('Skip dialog <' + vm.dialogKey + '> with default action <' + vm.defaultAction + '>');

                // close modal instance at the end of the current event queue
                // (has no effect if executed immediately here)
                $timeout(function () {
                    $uibModalInstance.close(vm.defaultAction);
                });
            }
        };

        vm.cancel = function () {
            vm.saveSkipDialogSetting();
            $uibModalInstance.close(false);
        };

        vm.yesDelete = function () {
            vm.saveSkipDialogSetting();
            $uibModalInstance.close(true);
        };

        vm.saveSkipDialogSetting = function () {
            confirmDialogService.setDialogActive(vm.dialogKey, !vm.doNotShowMessageAgain);
            confirmDialogService.save();
        };

        vm.getSkipDialogSetting = function () {
            return confirmDialogService.isDialogSkipped(vm.dialogKey);
        };
    });
})();
