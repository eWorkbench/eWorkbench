/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Widget that displays a navbar with menu entries and an overflow menu
     */
    module.directive('orderedMenuWidget', function () {
        return {
            'restrict': 'E',
            'templateUrl': 'js/widgets/orderedMenu/orderedMenu.html',
            'controller': 'OrderedMenuWidgetController',
            'bindToController': true,
            'controllerAs': 'vm',
            'scope': {
                'grayOut': '='
            }
        }
    });

    module.controller('OrderedMenuWidgetController', function (
        $rootScope,
        $scope,
        $state,
        $timeout,
        $transitions,
        $window,
        $location,
        $injector,
        OrderedMenuRestService,
        gettextCatalog,
        toaster,
        IconImagesService,
        ProjectSidebarService,
        confirmDialogWidget
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            /**
             * List of menu entries
             * @type {Array}
             */
            vm.menuEntries = [];

            /**
             * Whether or not editing is enabled
             * @type {boolean}
             */
            vm.isEditing = false;

            /**
             * Max menu items before they overflow
             * @type {number}
             */
            vm.maxItemsBeforeOverflow = 5;

            vm.selectedMenuEntry = null;

            /**
             * Whether or not the popover is opened
             * @type {boolean}
             */
            vm.popoverOpened = false;

            /**
             * get correct icons
             */
            vm.editIcon = IconImagesService.mainActionIcons.edit;
            vm.saveIcon = IconImagesService.mainActionIcons.check;
            vm.cancelIcon = IconImagesService.searchElementIcons.cancel;
        };

        /**
         * Every click on navbar
         * @param menuEntry
         * @param $event
         */
        vm.clickOnNavbar = function (menuEntry, $event) {
            if (vm.grayOut) {
                // prevent default / prevent click from being handled by anything else
                $event.preventDefault();

                var modalInstance = confirmDialogWidget.open({
                    title: gettextCatalog.getString('Leave project?'),
                    message: gettextCatalog.getString(
                        'You are about to leave the current project. To browse inside the project, use the navigation bar on the left. Do you want to continue?'
                    ),
                    cancelButtonText: gettextCatalog.getString('No'),
                    okButtonText: gettextCatalog.getString('Yes'),
                    dialogKey: 'LeaveProject'
                });

                modalInstance.result.then(
                    function confirm (stayInProject) {
                        if (stayInProject) {
                            ProjectSidebarService.project = null;

                            window.location.href = menuEntry.url;
                        }
                    },
                    function dismiss () {
                        // do nothing
                    }
                );
            }
        };

        vm.selectEntry = function (menuEntry) {
            vm.selectedMenuEntry = menuEntry;
        };

        /**
         * Get all Menu Entries from REST API
         * Sets title and icon of the entry by looking up the state
         */
        var getMenuEntries = function () {
            return OrderedMenuRestService.query().$promise.then(
                function success (response) {
                    vm.menuEntries = vm.filterDuplicates(response);
                    vm.mainMenuEntries = angular.copy(vm.menuEntries);
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Could not load menu entries"));
                }
            );
        };

        /**
         * Filters duplicate menu entries from the REST response.
         * TODO: Fix this in the backend instead
         */
        vm.filterDuplicates = function (response) {
            var routes = {},
                entries = [];

            for (var i = 0; i < response.length; i++) {
                var menuItem = response[i];

                if (!routes.hasOwnProperty(menuItem.route)) {
                    routes[menuItem.route] = true;
                    entries.push(menuItem);
                }
            }

            return entries;
        };

        /**
         * Toggle editing
         */
        vm.toggleEdit = function () {
            vm.isEditing = !vm.isEditing;
        };

        /**
         * Save changes on menu entries via REST API
         */
        vm.saveChanges = function () {
            // save changes to api
            OrderedMenuRestService.updateOrdering(vm.menuEntries).$promise.then(
                function success (response) {
                    vm.toggleEdit();
                    vm.menuEntries = vm.filterDuplicates(response);
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', "Failed to update menu");
                }
            );
        };

        vm.checkIfDragIsAllowed = function (index, targetList) {
            if (targetList == 'overflow' && index == 0) {
                return false;
            }

            return true;
        };

        /**
         * Cancel changes on menu entries
         */
        vm.cancelChanges = function () {
            // restore from before
            getMenuEntries().then(vm.toggleEdit);
        };


        var arrayMove = function (arr, fromIndex, toIndex) {
            var element = arr[fromIndex];

            arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, element);
        };

        /**
         * On Drop of Menu Item, update the ordering
         * @param menuEntry
         * @param index
         * @param targetList
         */
        vm.dropCallback = function (menuEntry, index, targetList) {
            var fromIndex = vm.menuEntries.indexOf(menuEntry);
            var targetIndex = index;

            // if item is dropped into the overflow menu, we need to increase the targetIndex
            if (targetList == 'overflow') {
                // vm.menuEntries.splice(index, 1);
                targetIndex += vm.maxItemsBeforeOverflow;
            }

            // move item in array
            arrayMove(vm.menuEntries, fromIndex, targetIndex);

            // adapt ordering based on array index
            for (var i = 0; i < vm.menuEntries.length; i++) {
                vm.menuEntries[i].ordering = i;
            }
        };

        var calculateMaxItemsBeforeOverflow = function () {
            var
                /**
                 * Window inner width
                 * @type {number}
                 */
                newWidth = $window.innerWidth,
                /**
                 * width for username and help width on the right
                 * @type {number}
                 */
                usernameAndHelpWidgetWidth = jQuery("#navbar-username-and-info").outerWidth() + 5,
                /**
                 * Width of searchbar
                 * @type {number}
                 */
                searchbarWidth = jQuery("#navbar-search-widget").outerWidth() + 5,
                /**
                 * Width of navbar header on the left side (title and version)
                 * +2 extra pixels to increase for rounding errors
                 * @type {number}
                 */
                headerWidth = jQuery(".navbar-header").outerWidth() + 5 + 2,
                /**
                 * Width of the item that contains the overflow ellipsis button
                 * @type {number}
                 */
                overflowUlWidth = 50,
                /**
                 * Width of the bell icon
                 * @type {number}
                 */
                bellIconWidth = 50,
                /**
                 * Width available for the ordered menu
                 * @type {number}
                 */
                availableWidthForOrderedMenu = 0;

            if (newWidth < 768) {
                // xs screen -> has a different menu, disable overflow
                vm.maxItemsBeforeOverflow = 100;

                return;
            } else if (newWidth >= 768 && newWidth < 992) {
                // small screen, shows username on the right side
                availableWidthForOrderedMenu = newWidth - headerWidth -
                    usernameAndHelpWidgetWidth - overflowUlWidth - bellIconWidth;
            } else {
                // normal screen, shows username and searchbar on the right side
                availableWidthForOrderedMenu = newWidth - headerWidth -
                    usernameAndHelpWidgetWidth - searchbarWidth - overflowUlWidth - bellIconWidth;
            }

            // determine maxItemsBeforeOverflow by iterating over the menu items and calculating the max width
            var i = 0,
                sumWidth = 0;

            while (i < vm.menuEntries.length) {
                // each item has a pre-calculated (estimated) width, which we need to sum up
                sumWidth += vm.menuEntries[i].width;

                // if the sum is greater than the available width, we are done
                if (sumWidth >= availableWidthForOrderedMenu) {
                    break;
                }

                i++;
            }

            vm.maxItemsBeforeOverflow = i;
        };

        /**
         * On Resize, re calculate the maximum items that should be shown
         */
        angular.element($window).bind('resize', function () {
            // trigger a digest cycle for the current scope afterwards
            $scope.$apply(calculateMaxItemsBeforeOverflow);
        });

        /**
         * Watch the navbar header width for changes, as this could potentially change after we have calculated
         * the max items
         */
        $scope.$watch(function () {
            return jQuery(".navbar-header").outerWidth();
        }, function (newValue, oldValue) {
            if (newValue && newValue > 0) {
                calculateMaxItemsBeforeOverflow();
            }
        });

        /**
         * transition handler -> closes the overflow-popover when a transition happens
         * This fixes an issue with mobile devices, but it is also good to have
         */
        $transitions.onBefore({}, function (trans) {
            vm.popoverOpened = false;

            // authed --> allow transition
            return true;
        });

        // get menu entries, then calculate the max items before overflow
        getMenuEntries().then(calculateMaxItemsBeforeOverflow);

        /**
         * changes the entries in the menu
         */
        $rootScope.$on("change-menu-entries", function (event, opt) {
            if (opt.menu_entries) {
                vm.menuEntries = opt.menu_entries;
            } else {
                vm.menuEntries = vm.mainMenuEntries;
            }
        });
    });
})();
