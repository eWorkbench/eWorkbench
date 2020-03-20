/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Show a modal dialog to create new metadata fields.
     */
    module.service('MetadataFieldCreateModalService', function ($uibModal) {
        "ngInject";

        var service = {};

        /**
         * Opens the modal dialog.
         * @returns {*}
         */
        service.open = function (fieldName) {
            return $uibModal.open({
                templateUrl: 'js/screens/metadata/createFieldModal/metadataFieldCreateModal.html',
                controller: 'MetadataFieldCreateModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    fieldName: function () {
                        return fieldName;
                    }
                }
            });
        };

        return service;
    });

    module.controller('MetadataFieldCreateModalController', function (
        $uibModalInstance,
        $scope,
        gettextCatalog,
        toaster,
        MetadataFieldsRestService,
        MetadataFieldService,
        MetadataBaseTypes,
        AuthRestService,
        // injected from uibModal.open():
        fieldName
    ) {
        "ngInject";

        var vm = this,
            baseTypes = MetadataBaseTypes,
            currentUser = AuthRestService.getCurrentUser();

        this.$onInit = function () {
            vm.userHasCreatePermission = currentUser.permissions.indexOf('metadata.add_metadatafield') >= 0;
            vm.saveButtonLabel = vm.userHasCreatePermission
                ? gettextCatalog.getString('Create')
                : gettextCatalog.getString('Send suggestion');

            vm.name = fieldName;
            vm.description = null;
            vm.fieldType = 'whole_number';
            vm.typeSettings = {};
            vm.errors = {};

            vm.fieldTypeMap = {};
            for (var baseType in baseTypes) {
                if (baseTypes.hasOwnProperty(baseType)) {
                    vm.fieldTypeMap[baseType] = baseTypes[baseType].label;
                }
            }
        };

        /**
         * Reset type settings when fieldType changes.
         */
        $scope.$watch('vm.fieldType', function () {
            if (vm.fieldType && vm.fieldType in baseTypes) {
                // needs a deep copy of the object to avoid having default values in new fields of the same type
                vm.typeSettings = angular.copy(baseTypes[vm.fieldType].default_settings);
            } else {
                vm.typeSettings = {};
            }
        }, true);

        /**
         * Save changes via REST API and close the modal on success.
         */
        vm.save = function () {
            var data = {
                'name': vm.name || '',
                'description': vm.description || '',
                'base_type': vm.fieldType,
                'type_settings': vm.typeSettings
            };

            MetadataFieldsRestService.create(data).$promise.then(
                function success (response) {
                    if (response.request_status) {
                        // request mail sent
                        toaster.pop('success', gettextCatalog.getString("New metadata field request sent"));
                    } else {
                        // metadata was added
                        MetadataFieldService.addField(response);
                    }
                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    console.log(rejection);
                    console.log(rejection.data);
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
