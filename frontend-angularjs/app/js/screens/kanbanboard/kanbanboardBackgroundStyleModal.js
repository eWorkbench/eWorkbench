/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Service for the kanbanboard's background style modal.
     */
    module.service('KanbanboardBackgroundStyleModalService', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @param loadKanbanboard Function to load the Kanban board.
         *                        Required because our reference to the Kanban board becomes outdated,
         *                        when it is reloaded from the API (in the main view).
         * @param saveKanbanboardPartial Function to save a part of the Kanban board.
         * @returns {$uibModalInstance}
         */
        service.open = function (loadKanbanboard, saveKanbanboardPartial) {
            return $uibModal.open({
                templateUrl: 'js/screens/kanbanboard/kanbanboardBackgroundStyleModal.html',
                controller: 'KanbanboardBackgroundStyleController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    loadKanbanboard: function () {
                        return loadKanbanboard;
                    },
                    saveKanbanboardPartial: function () {
                        return saveKanbanboardPartial
                    }
                }
            });
        };

        return service;
    });

    module.controller('KanbanboardBackgroundStyleController', function (
        $scope,
        $uibModalInstance,
        gettextCatalog,
        toaster,
        PermissionService,
        selectFileWithPicker,
        KanbanboardRestService,
        // from $uibModal.resolve:
        loadKanbanboard,
        saveKanbanboardPartial
    ) {
        'ngInject';

        var vm = this,
            backgroundColorAutoSaveDelayMilliseconds = 1000,
            bgColorChangeCount = 0,
            backgroundColorInitialized = false,
            reloadKanbanboard = function () {
                vm.kanbanboard = loadKanbanboard();
                vm.backgroundColor = vm.kanbanboard.background_color;
            };

        this.$onInit = function () {
            reloadKanbanboard();
        };

        vm.showRemoveImageLink = function () {
            return vm.kanbanboard.download_background_image != null;
        };

        /**
         * Determines whether the model can be modified by the current user or not.
         * @returns {boolean}
         */
        vm.isReadOnly = function () {
            return !PermissionService.has('object.edit', vm.kanbanboard)
        };

        vm.saveBackgroundColor = function () {
            var result = saveKanbanboardPartial('background_color', vm.kanbanboard.background_color);

            result.then(function () {
                reloadKanbanboard();
            });

            return result;
        };

        vm.saveBackgroundImage = function (image) {
            var result = saveKanbanboardPartial('background_image', image);

            result.then(function () {
                reloadKanbanboard();
            });

            return result;
        };

        vm.onOkButton = function () {
            $uibModalInstance.close();
        };

        vm.uploadNewBackgroundImage = function () {
            selectFileWithPicker().then(
                function fileSelected (file) {
                    vm.saveBackgroundImage(file);
                }
            );
        };

        /**
         * Removes the background image
         */
        vm.removeBackgroundImage = function () {
            var data = {
                pk: vm.kanbanboard.pk
            };

            return KanbanboardRestService.resource.clearBackgroundImage(data).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Removed"));
                    vm.kanbanboard.$get();
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to delete the image"));
                    console.log(rejection);
                }
            );
        };

        var saveBackgroundColorAfterLastInput = function () {
            bgColorChangeCount++;
            var changedId = bgColorChangeCount;

            // automatically save the background color, when the user hasn't changed it for some time
            setTimeout(function () {
                if (changedId >= bgColorChangeCount) {
                    vm.saveBackgroundColor();
                }
            }, backgroundColorAutoSaveDelayMilliseconds);
        };

        $scope.$watch("vm.backgroundColor", function (newVal, oldVal) {
            vm.kanbanboard.background_color = newVal;

            if (backgroundColorInitialized) {
                saveBackgroundColorAfterLastInput();
            } else {
                backgroundColorInitialized = true;
            }
        });

    });
})();
