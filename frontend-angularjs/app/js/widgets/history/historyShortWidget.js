/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * A history widget that displays the N most recent entries of the history of baseModel
     */
    module.directive('historyShortWidget', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/history/historyShortWidget.html',
            controller: 'HistoryShortWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                baseUrlModel: '@',
                baseModel: '=',
                expanded: '=?',
                changesPerPage: '=?'
            }
        };
    });

    module.controller('HistoryShortWidgetController', function (
        $scope,
        gettextCatalog,
        toaster,
        WorkbenchElementsTranslationsService,
        PaginatedHistoryRestServiceFactory,
        HistoryModelTypeService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm._changesPerPage = 10;

            /**
             * a list of history entries
             * @type {Array}
             */
            vm.histories = [];

            /**
             * Whether or not there are more history entries available
             * @type {boolean}
             */
            vm.showMoreEntries = false;

            /**
             * Stores the number of history entries
             * @type {number}
             */
            vm.numberOfChanges = 0;

            /**
             * Whether or not the history has loaded yet
             * @type {boolean}
             */
            vm.historyLoaded = false;

            /**
             * ViewMode - 'limited' shows only 5 change entries, while 'all' shows a pagination
             * @type {string}
             */
            vm.viewMode = 'limited';

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentLimit = vm._changesPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentOffset = 0;

            vm.modelNameToTranslation = WorkbenchElementsTranslationsService.modelNameToTranslation;

            // set changes per page (else they will default to 10, see above)
            if (vm.changesPerPage) {
                vm._changesPerPage = vm.changesPerPage;
            }

            vm.historyService = PaginatedHistoryRestServiceFactory(vm.baseUrlModel, vm.baseModel.pk);

            if (vm.expanded) {
                vm.showMoreEntries = true;
                vm.viewMode = 'all';
            }

            $scope.$watch('vm.baseModel.version_number', function () {
                // update history depending on the current view mode
                if (vm.viewMode === 'all') {
                    vm.getHistory(vm.currentLimit, vm.currentOffset);
                } else {
                    vm.getHistory();
                }

            }, true);

            vm.historyModelTypeService = HistoryModelTypeService;
            vm.historyDetailsVisible = {};
        };

        /**
         * Returns the translated field
         */
        vm.getTranslatedFieldName = function (field) {
            return WorkbenchElementsTranslationsService.translateFieldName(vm.baseUrlModel, field)
        };

        /**
         * Gets the history for this element and stores the number of history entries
         */
        vm.getHistory = function (limit, offset) {
            if (limit === undefined) {
                limit = 5;
            }
            if (offset === undefined) {
                offset = 0;
            }

            return vm.historyService.get({limit: limit, offset: offset}).$promise.then(
                function success (response) {
                    if (response.count && response.count > 5) {
                        vm.numberOfChanges = response.count;
                        vm.showMoreEntries = true;
                    } else {
                        vm.showMoreEntries = false;
                    }
                    vm.histories = response.results;
                    vm.historyLoaded = true;
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to load history"));
                    console.log(rejection);
                }
            );
        };

        vm.toggleHistoryDetails = function (history) {
            vm.historyDetailsVisible[history.pk] = !vm.historyDetailsVisible[history.pk];
        };

        /**
         * Toggles view mode - show more changes
         */
        vm.showMoreChanges = function () {
            vm.viewMode = 'all';
            vm.pageChanged();
        };

        /**
         * Toggles view mode - show less changes
         */
        vm.showLessChanges = function () {
            vm.viewMode = 'limited';
            vm.getHistory();
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * vm._changesPerPage;
            vm.currentLimit = vm._changesPerPage;
            vm.getHistory(vm.currentLimit, vm.currentOffset);
        };
    });
})();
