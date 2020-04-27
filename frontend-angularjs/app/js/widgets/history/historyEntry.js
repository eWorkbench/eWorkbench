/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * render history Entries
     */

    module.directive('historyEntryWidget', function () {
        return {
            templateUrl: 'js/widgets/history/historyEntry.html',
            controller: 'HistoryEntryWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                changeRecords: '=',
                baseUrlModel: '=',
                history: '='
            }
        };
    });

    module.controller('HistoryEntryWidgetController', function (WorkbenchElementsTranslationsService) {
        'ngInject';

        var vm = this;

        /**
         * Determines whether to show an entry or not.
         */
        vm.isChangeRecordVisible = function (changeRecord) {
            var hiddenFields = [
                'path', // internal value
                'original_filename' // initially the same as filename and never changes
            ];

            return hiddenFields.indexOf(changeRecord.field_name) < 0;
        };

        /**
         * Returns the translated field
         */
        vm.getTranslatedFieldName = function (field) {
            return WorkbenchElementsTranslationsService.translateFieldName(vm.baseUrlModel, field);
        };

    });
})();
