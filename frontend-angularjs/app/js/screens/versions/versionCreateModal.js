/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.service('VersionCreateModalService', function ($uibModal) {
        "ngInject";

        var service = {},
            openModal = function (modelName, modelId, versionNumber, isAutoPrompt) {
                return $uibModal.open({
                    templateUrl: 'js/screens/versions/versionCreateModal.html',
                    controller: 'VersionCreateModalController',
                    controllerAs: 'vm',
                    backdrop: 'static', // do not close modal by clicking outside
                    resolve: {
                        modelName: function () {
                            return modelName
                        },
                        modelId: function () {
                            return modelId
                        },
                        versionNumber: function () {
                            return versionNumber
                        },
                        isAutoPrompt: function () {
                            return isAutoPrompt
                        }
                    }
                });
            };

        service.openAutoPrompt = function (modelName, modelId, versionNumber) {
            return openModal(modelName, modelId, versionNumber, true);
        };

        service.open = function (modelName, modelId, versionNumber) {
            return openModal(modelName, modelId, versionNumber, false);
        };

        return service;
    });

    module.controller('VersionCreateModalController', function (
        $uibModalInstance,
        $cookies,
        gettextCatalog,
        toaster,
        VersionRestServiceFactory,
        // provided by $uibModal.open.resolve
        modelName,
        modelId,
        versionNumber,
        isAutoPrompt
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.versionNumber = versionNumber;
            vm.summary = '';
            vm.doNotAsk = false;
            vm.errors = {};
            vm.versionRestService = VersionRestServiceFactory(modelName, modelId);
        };

        /**
         * Indicates whether the dialog is based on an automated prompt.
         */
        vm.isAutoPrompt = function () {
            return isAutoPrompt;
        };

        /**
         * Saves the "do not ask again" setting (for automated prompts).
         */
        vm.saveDoNotAsk = function () {
            if (vm.doNotAsk) {
                $cookies.put('DoNotAskForVersion', 'true');
            } else {
                $cookies.remove('DoNotAskForVersion');
            }
        };

        /**
         * Save changes via REST API, close the modal afterwards
         */
        vm.save = function () {
            var data = {
                'summary': vm.summary
            };

            vm.versionRestService.create(data).$promise.then(
                function success (response) {
                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    console.log(rejection);
                    vm.errors = rejection.data;
                }
            );
        };

        /**
         * Dismiss the modal
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    })
})();
