/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A directive for searching for generic elements
     */
    module.directive('genericSearchWidget', function () {
        return {
            templateUrl: 'js/widgets/genericSearchWidget/genericSearchWidget.html',
            controller: 'GenericSearchWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                modelName: '<',
                modelId: '=', // model id (primary key) to exclude from search results
                searchTableColumnConfig: '=', // array
                selectCallback: '&',
                cancelCallback: '&',
                selectedItems: "=",
                onSelectionChanged: '&?', // optional callback for changed selection
                disabled: '<' // no intial search will be performed until this flag becomes true
            }
        }
    });

    module.controller('GenericSearchWidgetController', function (
        $scope,
        toaster,
        gettextCatalog,
        IconImagesService,
        GenericSearchService,
        GenericModelService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.disabledRevoked = false;

            /**
             * save the search input from the user
             * @type {string}
             */
            vm.searchField = "";

            /**
             * save the search results which are received from the REST API
             * @type {Array}
             */
            vm.searchResult = [];

            /**
             * true - waiting for the REST API result
             * false - no waiting (no search or result is received)
             * @type {boolean}
             */
            vm.searching = false;

            /**
             * Constant which defines the date range for getting the modified objects for this user
             */
            vm.elementsModifiedDayRange = 7;

            vm.searchResource = GenericModelService.getRestServiceByModelName(vm.modelName).resource.search;
            vm.waitingIcon = IconImagesService.searchElementIcons.waiting;
            vm.noResultIcon = IconImagesService.searchElementIcons.noResult;
        };

        /**
         * user pressed the cancel button in the modal dialog
         */
        vm.cancel = function () {
            vm.cancelCallback({});
        };

        /**
         * Checks if the given item is currently selected.
         * @param item
         * @returns {boolean}
         */
        vm.itemIsSelected = function (item) {
            for (var j = 0; j < vm.selectedItems.length; j++) {
                if (item.pk === vm.selectedItems[j].pk) {
                    return true;
                }
            }

            return false;
        };

        /**
         * build a search query request to the find specific elements
         */
        vm.doSearch = function (searchString) {
            vm.searchField = searchString;

            var applyPreviousSelectionToResponse = function (response) {
                for (var i = 0; i < response.length; i++) {
                    var responseEntry = response[i];

                    responseEntry.selected = vm.itemIsSelected(responseEntry);
                }
            };

            var appendSelectedItemsThatAreNotInResponse = function (response) {
                for (var i = 0; i < vm.selectedItems.length; i++) {
                    var selectedItem = vm.selectedItems[i],
                        selectedItemIsInSearchResult = false;

                    if (!selectedItem.selected) {
                        // selected item does not have "selected" flag set -> ignore
                        break;
                    }

                    for (var l = 0; l < response.length; l++) {
                        if (selectedItem.pk === response[l].pk) {
                            // selected item is in search results -> nothing to do
                            selectedItemIsInSearchResult = true;
                            break;
                        }
                    }

                    if (!selectedItemIsInSearchResult) {
                        response.push(selectedItem);
                    }
                }
            };

            vm.searching = true;
            GenericSearchService.search(vm.searchResource, searchString, vm.elementsModifiedDayRange).$promise.then(
                function success (response) {
                    if (!vm.searchField || String(vm.searchField).trim().length <= 0) {
                        // just show selected items if there is no search input
                        vm.searchResult = vm.selectedItems;
                    } else {
                        applyPreviousSelectionToResponse(response);
                        appendSelectedItemsThatAreNotInResponse(response);
                    }

                    vm.searchResult = response;
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Search failed"));
                    console.log(rejection);
                }
            ).finally(function () {
                vm.searching = false;
            });
        };

        /**
         * reset the search field
         */
        vm.cancelSearch = function () {
            vm.searching = false;
            vm.searchResult = [];
            vm.searchField = "";
            vm.selectedItems = [];

            vm.doSearch("");
        };

        vm.toggleItemSelected = function (result) {
            // toggle selection status
            result.selected = !result.selected;

            // update selected items
            var itemIsInSelectedItems = false;

            for (var i = 0; i < vm.selectedItems.length; i++) {
                var selectedItem = vm.selectedItems[i];

                if (selectedItem.pk === result.pk) {
                    if (result.selected) {
                        // update selection status
                        selectedItem.selected = true;
                        itemIsInSelectedItems = true;
                    } else {
                        // remove it
                        vm.selectedItems.splice(i);
                    }
                    break;
                }
            }

            if (result.selected && !itemIsInSelectedItems) {
                // add new selected item
                vm.selectedItems.push(result);
            }

            // run callback to notify parent that the selection has changed
            vm.onSelectionChanged();
        };

        /**
         * filter the search results that the current object does not appear in the result list
         *  - so the user can not relate the object to itself
         * @param result
         * @returns {boolean}
         */
        vm.removeOwnObject = function (result) {
            return result.pk !== vm.modelId;
        };

        /**
         * Wait for vm search resource to be init'ed, before we submit the first search
         */
        $scope.$watch("vm.searchResource", function () {
            if (!vm.disabled) {
                vm.doSearch("");
            }
        });

        /**
         * Triggers the initial search once the disabled flag is revoked
         */
        $scope.$watch("vm.disabled", function () {
            if (!vm.disabledRevoked && !vm.disabled) {
                vm.disabledRevoked = true;
                vm.doSearch(vm.searchField);
            }
        });
    });
})();
