/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Displays metadata of a generic base entity.
     */
    module.directive('metadataFieldsWidget', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/metadata/fieldsWidget/metadataFieldsWidget.html',
            controller: 'MetadataFieldsWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                readOnly: '<',
                baseUrlModel: '@',
                baseModel: '=',
                onAbort: '&?',
                onSave: '&',
                onSaveMultiple: '&?',
                metadata: '='
            }
        }
    });

    module.controller('MetadataFieldsWidgetController', function (
        $scope,
        $injector,
        $q,
        $timeout,
        gettextCatalog,
        toaster,
        WorkbenchElementsTranslationsService,
        PermissionService,
        MetadataFieldCreateModalService,
        AuthRestService,
        IconImagesService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.newMetadataField = null;
            vm.currentUser = AuthRestService.getCurrentUser();
            vm.isViewable = vm.currentUser.permissions.indexOf('metadata.view_metadata') >= 0;
            vm.trashIcon = IconImagesService.mainActionIcons.trash;
        };

        /**
         * Checks whether the user is allowed to edit the base model.
         * @returns {boolean}
         */
        vm.isReadOnly = function () {
            // is called quite often but can't be evaluated in this.$onInit = function () {  init();  };,
            // because PermissionService.has() returns false there
            return vm.readOnly
                || vm.baseModel.deleted
                || !PermissionService.has('object.edit', vm.baseModel);
        };

        /**
         * Add the chosen metadata field when selected.
         */
        $scope.$watch('vm.newMetadataField', function () {
            var metadataToAdd = null;

            if (vm.newMetadataField) {
                metadataToAdd = {
                    'field': vm.newMetadataField,
                    'values': {}
                };
                vm.metadata.push(metadataToAdd);

                // set a flag at the end of the event queue, so SaveCancel Buttons appear for the new metadata
                $timeout(function () {
                    metadataToAdd.added = true;
                });

                vm.newMetadataField = null;
            }
        }, true);

        vm.markDeleted = function (metadata) {
            metadata.deleted = true;
        };

        /**
         * Handler for save button, if a single field changed (of Save/Cancel buttons)
         */
        vm.save = function (metadata) {
            removeAllMarkedMetadata();

            return vm.onSave();
        };

        /**
         * Handler for save button, if multiple fields changed (of Save/Cancel buttons)
         */
        vm.saveMultiple = function () {
            removeAllMarkedMetadata();

            return vm.onSaveMultiple();
        };

        /**
         * Handler for cancel button (of Save/Cancel buttons)
         */
        vm.abort = function (metadata) {
            // remove metadata if it was just added (and has not been persisted yet)
            if (metadata.added) {
                var index = vm.metadata.indexOf(metadata);

                vm.metadata.splice(index, 1);
            }

            // call onAbort from directive arguments, if available
            if (vm.onAbort) {
                vm.onAbort();
            }
        };

        /**
         * Removes all marked-as-deleted metadata from the list (without changing the reference of vm.metadata).
         */
        var removeAllMarkedMetadata = function () {
            var i = 0,
                metadata = null,
                metadataToKeep = [];

            // analyse which metadata elements we want to keep
            for (i = 0; i < vm.metadata.length; i++) {
                metadata = vm.metadata[i];

                if (!metadata.deleted) {
                    metadataToKeep.push(metadata);
                }
            }

            // clear all old elements, then re-add the elements we want to keep
            vm.metadata.splice(0, vm.metadata.length);
            for (i = 0; i < metadataToKeep.length; i++) {
                metadata = metadataToKeep[i];
                vm.metadata.push(metadata);
            }
        };

        /**
         * Opens the dialog to create new metadata fields.
         */
        vm.openNewMetadataFieldDialog = function () {
            MetadataFieldCreateModalService.open();
        };

    });
})();
