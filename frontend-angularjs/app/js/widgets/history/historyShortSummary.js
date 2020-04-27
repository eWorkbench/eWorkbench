/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Show a short summary for a history entry
     */
    module.directive('historyShortSummary', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/history/historyShortSummary.html',
            controller: 'HistoryShortSummaryController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                history: '<',
                baseUrlModel: '<'
            }
        };
    });

    module.controller('HistoryShortSummaryController', function (
        $scope,
        gettextCatalog,
        WorkbenchElementsTranslationsService,
        HistoryModelTypeService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.modelNameTranslation = WorkbenchElementsTranslationsService
                .modelNameToTranslation[vm.history.object_type.model];

            vm.historyChangeText = HistoryModelTypeService.historyChangeText[vm.history.changeset_type];

            /*
             * Changeset types:
             * I ... insert
             * S ... soft delete
             * D ... delete
             * R ... restore
             * U ... update
             */
            vm.isInsert = 'ISDR'.indexOf(vm.history.changeset_type) >= 0;
            vm.isUpdate = vm.history.changeset_type === 'U';

            // check if it is a file upload after the initial creation
            var changeMap = getChangedFieldValueMap();

            vm.isFileUpload = vm.isUpdate && vm.baseUrlModel === 'file' && changeMap.hasOwnProperty('path');
            if (vm.isFileUpload) {
                vm.fileName = changeMap.name;
            }
        };

        /**
         * Returns the translated field name.
         */
        vm.getTranslatedFieldName = function (field) {
            return WorkbenchElementsTranslationsService.translateFieldName(vm.baseUrlModel, field);
        };

        /**
         * Gets a map (fieldName -> newValue) of all new values.
         * @returns {{}}
         */
        function getChangedFieldValueMap () {
            var fieldMap = {};

            for (var i = 0; i < vm.history.change_records.length; i++) {
                var changeRecord = vm.history.change_records[i];

                fieldMap[changeRecord.field_name] = changeRecord.new_value;
            }

            return fieldMap;
        }
    });
})();
