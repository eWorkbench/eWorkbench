/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    module.directive('globalSearchWidget', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/globalSearch/globalSearchWidget.html',
            controller: 'GlobalSearchWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {}
        }
    });

    module.controller('GlobalSearchWidgetController', function (
        $injector,
        $scope,
        $state,
        gettextCatalog,
        ProjectRestService,
        SearchRestService,
        IconImagesService,
        WorkbenchElementsTranslationsService,
        AuthRestService,
        GenericModelService
    ) {
        'ngInject';

        var
            vm = this,

            /**
             * Models available for search restriction.
             * @type {Array}
             */
            models = [],

            /**
             * Promise for the search results
             * @type {(null|Object)}
             */
            searchResultsPromise = null,

            /**
             * Filter function to filter for items with selected
             * attribute set to true
             * @param item
             */
            filterSelected = function (item) {
                return Boolean(item.selected);
            },

            /**
             * Map function to map for the key attribute
             * @param item
             */
            mapKey = function (item) {
                return item.key;
            },

            /**
             * Trigger a new search
             */
            querySearch = function (searchTerms) {
                var
                    searchModels = models.filter(filterSelected).map(mapKey).join();

                searchResultsPromise = SearchRestService.resource.query(
                    {search: searchTerms, model: searchModels}
                ).$promise;

                return searchResultsPromise;
            };

        AuthRestService.getWaitForLoginPromise().then(function () {
            AuthRestService.getCurrentUser().$promise.then(
                function (user) {
                    vm.currentUser = user;
                    vm.canSeeMetadata = vm.currentUser.permissions.indexOf('metadata.view_metadata') >= 0;
                }
            );
        });

        /**
         * gets the correct search icons
         */
        vm.noResultIcon = IconImagesService.searchElementIcons.noResult;
        vm.searchIcon = IconImagesService.searchElementIcons.search;
        vm.searchingIcon = IconImagesService.searchElementIcons.searching;

        // fill models with all searchableModels
        for (var i = 0; i < WorkbenchElementsTranslationsService.searchableModels.length; i++) {
            var contentType = WorkbenchElementsTranslationsService.searchableModels[i];

            var modelName = WorkbenchElementsTranslationsService.contentTypeToModelName[contentType];

            var model = {
                'key': modelName,
                'value': WorkbenchElementsTranslationsService.modelNameToTranslation[modelName],
                'icon': IconImagesService.mainElementIcons[modelName],
                'selected': false
            };

            models.push(model);
        }

        /**
         * Returns the value for the input field after selection
         * of a result
         * @param model
         * @returns {string}
         */
        vm.formatSelection = function (model) {
            return '';
        };

        /**
         * Goes to the view for the given model
         * @param model
         */
        vm.goToItem = function (model) {
            var modalService = GenericModelService.getCreateModalService(model);

            // go to the element
            window.location.href = modalService.getViewUrl(model);
        };

        /**
         * Gets the search results
         * @param value
         * @returns {null|Object}
         */
        vm.getSearchResults = function (value) {
            return querySearch(value);
        };

        /**
         * Gets available models for selection
         * @returns {Array}
         */
        vm.getModels = function () {
            return models;
        };

        /**
         * Search term in the input field
         * @type {string}
         */
        vm.searchTerms = '';

        /**
         * Indicates the loading state
         * @type {boolean}
         */
        vm.isLoading = false;

        /**
         * Indicates the state for no results
         * @type {boolean}
         */
        vm.noResults = false;

        /**
         * Watcher to reset the `noResults` state on empty input
         */
        $scope.$watch('vm.searchTerms', function (newValue) {
            if (!newValue) {
                vm.noResults = false;
            }
        });

        console.log('Global Search Controller');
    });
})();
