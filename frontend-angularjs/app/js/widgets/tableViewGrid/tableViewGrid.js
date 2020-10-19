/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('tableViewGrid', function () {
        "ngInject";

        return {
            templateUrl: 'js/widgets/tableViewGrid/grid.html',
            restrict: 'E',
            bindToController: true,
            controllerAs: 'vm',
            controller: "TableViewGridController",
            scope: {
                // Unique key that identifies the table view. Used for storing the saved settings.
                key: '@',
                // Data to display in the grid
                data: '<',
                // Specific UI-Grid configuration
                gridOptions: '=',
                // Sorting
                orderBy: '=',
                orderDir: '=',
                // extra onRegisterApi callback (gridOptions.onRegisterApi would be overwritten)
                onRegisterApi: '<?'
            }
        };
    });

    module.directive('tableViewGridExpandable', function () {
        "ngInject";

        return {
            templateUrl: 'js/widgets/tableViewGrid/gridExpandable.html',
            restrict: 'E',
            bindToController: true,
            controllerAs: 'vm',
            controller: "TableViewGridController",
            scope: {
                // Unique key that identifies the table view. Used for storing the saved settings.
                key: '@',
                // Data to display in the grid
                data: '<',
                // Specific UI-Grid configuration
                gridOptions: '=',
                // Sorting
                orderBy: '=',
                orderDir: '=',
                // extra onRegisterApi callback (gridOptions.onRegisterApi would be overwritten)
                onRegisterApi: '<?'
            }
        };
    });

    module.controller("TableViewGridController", function (
        $scope,
        $timeout,
        $element,
        StorageService,
        gettextCatalog,
        DynamicTableSettingsService,
        DefaultTableStates,
        uiGridConstants,
        DebounceService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.gridOptions.data = vm.data;
            vm.stateLoaded = false;
            vm.refresh = false;
            vm.storageKey = 'grid_state_' + vm.key;
            vm.storageKeyDefault = vm.storageKey + '_default';

            vm.gridOptions.useExternalSorting = true;
            vm.gridOptions.onRegisterApi = function (gridApi) {
                // handle sort change
                vm.gridApi = gridApi;
                vm.gridApi.core.on.sortChanged($scope, function (grid, sortColumns) {
                    if (sortColumns.length === 0) {
                        vm.orderBy = null;
                        vm.orderDir = null;
                    } else {
                        vm.orderBy = sortColumns[0].field;
                        vm.orderDir = sortColumns[0].sort.direction;
                    }
                });

                // add reset menu entry
                vm.gridOptions.gridMenuCustomItems = [
                    {
                        title: gettextCatalog.getString('Reset table configuration to default'),
                        action: function ($event) {
                            vm.resetToDefaultState();
                            vm.saveState();
                        },
                        order: 999
                    }
                ];

                // define scrollbar handling
                vm.gridOptions.enableHorizontalScrollbar = uiGridConstants.scrollbars.WHEN_NEEDED;
                vm.gridOptions.enableVerticalScrollbar = uiGridConstants.scrollbars.NEVER;

                // load default config, then custom config
                $timeout(function () {
                    vm.resetToDefaultState();
                    vm.restoreSavedState();
                    vm.stateLoaded = true;

                    // run extra onRegisterApi callback if defined
                    if (vm.onRegisterApi) {
                        vm.onRegisterApi(gridApi);
                    }
                }, 0);

                // prevent ui-grid from catching scroll events,
                // so the user can scroll the page while the cursor is over the ui-grid
                $timeout(function () {
                    var $viewport = $element.find('.ui-grid-render-container'),
                        scrollEventList = [
                            'touchstart', 'touchmove', 'touchend',
                            'keydown',
                            'wheel', 'mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'
                        ];

                    scrollEventList.forEach(function (eventName) {
                        $viewport.unbind(eventName);
                    });
                });
            };
        };

        /**
         * Save the state of the grid, debounced for 2 seconds to not hammer the db
         */
        vm.saveState = DebounceService.debounce(function () {
            var state = vm.gridApi.saveState.save();

            if (state) {
                DynamicTableSettingsService.save(vm.storageKey, state).then(
                    function success () {
                    },
                    function error () {
                    }
                );
            }
        }, 2000);

        /**
         * Restore the state of the grid
         */
        vm.restoreSavedState = function () {
            var state = DynamicTableSettingsService.getSaved(vm.storageKey);

            if (state) {
                vm.gridApi.saveState.restore($scope, state);
            }

            // Setup events so we're notified when grid state changes.
            // These have to be here instead of the init: columnVisibilityChanged fires on init
            // otherwise and produces an API request
            vm.gridApi.colMovable.on.columnPositionChanged($scope, vm.saveState);
            vm.gridApi.colResizable.on.columnSizeChanged($scope, vm.saveState);
            vm.gridApi.core.on.sortChanged($scope, vm.saveState);
            vm.gridApi.core.on.columnVisibilityChanged($scope, vm.saveState);
        };

        /**
         * Reset the state of the grid to the defined default.
         */
        vm.resetToDefaultState = function () {
            var initialState = DefaultTableStates[vm.storageKey] || {};

            vm.gridApi.saveState.restore($scope, initialState);
        };
    });
})();
