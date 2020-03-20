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
                orderDir: '='
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
                orderDir: '='
            }
        };
    });

    module.directive('tableViewGridWithPagination', function () {
        "ngInject";

        return {
            templateUrl: 'js/widgets/tableViewGrid/gridWithPagination.html',
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
                // The absolute number of items available
                // (via API, not necessarily in the data collection -- might differ because of pagination)
                numberOfItems: '<'
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
        uiGridConstants
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
                vm.gridApi = gridApi;
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

                vm.gridOptions.enableHorizontalScrollbar = uiGridConstants.scrollbars.WHEN_NEEDED;
                vm.gridOptions.enableVerticalScrollbar = uiGridConstants.scrollbars.NEVER;

                // load default config, then custom config
                $timeout(function () {
                    vm.resetToDefaultState();
                    vm.restoreSavedState();
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

        // TODO: Extract into service/util
        // Returns a function, that, as long as it continues to be invoked, will not
        // be triggered. The function will be called after it stops being called for
        // N milliseconds. If `immediate` is passed, trigger the function on the
        // leading edge, instead of the trailing.
        vm.debounce = function (func, wait, immediate) {
            var timeout = null;

            return function () {
                var context = this,
                    args = arguments;
                var later = function () {
                    timeout = null;
                    if (!immediate) {
                        func.apply(context, args);
                    }
                };
                var callNow = immediate && !timeout;

                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) {
                    func.apply(context, args);
                }
            };
        };

        /**
         * Save the state of the grid, debounced for 2 seconds to not hammer the db
         */
        vm.saveState = vm.debounce(function () {
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
            vm.stateLoaded = true;

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
