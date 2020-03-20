/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.service('VersionRestoreModalService', function ($uibModal) {
        "ngInject";

        var service = {};

        service.open = function (baseModel, modelName, version, readonly, isLastVersionModified) {
            return $uibModal.open({
                templateUrl: 'js/screens/versions/versionRestoreModal.html',
                controller: 'VersionRestoreModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    baseModel: function () {
                        return baseModel
                    },
                    modelName: function () {
                        return modelName;
                    },
                    version: function () {
                        return version;
                    },
                    readonly: function () {
                        return readonly;
                    },
                    isLastVersionModified: function () {
                        return isLastVersionModified;
                    }
                }
            });
        };

        return service;
    });

    module.controller('VersionRestoreModalController', function (
        $uibModalInstance,
        gettextCatalog,
        toaster,
        VersionRestServiceFactory,
        PermissionService,
        // provided by $uibModal.open.resolve
        baseModel,
        modelName,
        version,
        readonly,
        isLastVersionModified
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.baseModel = baseModel;
            vm.modelName = modelName;
            vm.version = version;
            vm.readonly = readonly;
            vm.isLastVersionModified = isLastVersionModified;

            vm.errors = {};
            vm.previewModel = null;
            vm.loading = true;
            vm.previewError = false;

            vm.versionRestService = VersionRestServiceFactory(modelName, baseModel.pk);

            loadPreview();
        };

        var loadPreview = function () {
            var data = {
                'pk': vm.version.pk
            };

            vm.versionRestService.preview(data).$promise.then(
                function success (data) {
                    vm.previewModel = data;
                    vm.loading = false;
                    vm.previewError = false;
                },
                function error (rejection) {
                    console.log(rejection);
                    vm.errors = rejection.data;
                    vm.loading = false;
                    vm.previewError = true;
                }
            );
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readonly || vm.baseModel.deleted || !PermissionService.has('object.edit', vm.baseModel);
        };

        vm.restoreVersion = function () {
            if (vm.isLastVersionModified) {
                vm.finishUnsavedVersion(vm.sendRestoreRequest);
            } else {
                vm.sendRestoreRequest();
            }
        };

        vm.finishUnsavedVersion = function (actionOnSuccess) {
            var data = {
                'summary': ''
            };

            vm.versionRestService.create(data).$promise.then(
                function success (response) {
                    actionOnSuccess();
                },
                function error (rejection) {
                    console.log(rejection);
                    vm.errors = rejection.data;
                    toaster.pop("error", gettextCatalog.getString("Could not save unfinished version"));
                }
            );
        };

        vm.sendRestoreRequest = function () {
            var data = {
                'pk': vm.version.pk
            };

            vm.versionRestService.restore(data).$promise.then(
                function success (response) {
                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    vm.handleRestoreRequestError(rejection);
                }
            );
        };

        vm.handleRestoreRequestError = function (rejection) {
            console.log(rejection);
            vm.errors = rejection.data;

            if (rejection.data.non_field_errors) {
                toaster.pop(
                    "error",
                    gettextCatalog.getString("Could not restore"),
                    rejection.data.non_field_errors.join(", ")
                );
            } else {
                toaster.pop('error', gettextCatalog.getString("Could not restore"));
            }
        };

        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    })
})();
