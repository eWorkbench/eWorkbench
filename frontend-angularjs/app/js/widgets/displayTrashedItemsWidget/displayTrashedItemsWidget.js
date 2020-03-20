/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Service for display trashed items in an modal dialog. User can restore or delete this items.
     */
    module.service('displayTrashedItemsWidget', function (
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @returns {$uibModalInstance}
         */
        service.open = function (type) {
            return $uibModal.open({
                templateUrl: 'js/widgets/displayTrashedItemsWidget/displayTrashedItemsWidget.html',
                controller: 'DisplayTrashedItemsWidgetController',
                controllerAs: 'vm',
                resolve: {
                    type: function () {
                        return type;
                    }
                },
                'backdrop': 'static'
            });
        };

        return service;
    });

    // check if entityType is available in WorkbenchElementsTranslationsService
    module.controller('DisplayTrashedItemsWidgetController', function (
        $scope,
        $uibModalInstance,
        type,
        WorkbenchElementsTranslationsService,
        $injector,
        toaster,
        gettextCatalog,
        IconImagesService,
        TrashedItemsRestServiceFactory,
        PaginationCountHeader
    ) {
        "ngInject";

        var vm = this,
            /**
             * Config: Number of items displayed per page
             * @type {number}
             * */
            itemsPerPage = 10;

        this.$onInit = function () {
            /**
             * default sort column
             */
            vm.sortColumn = "name";

            /**
             * Default Sort order
             * @type {boolean}
             */
            vm.sortReverse = false;

            /**
             * array of trashed objects
             */
            vm.objectList = [];

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentLimit = itemsPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentOffset = 0;

            /**
             * title in modal view
             * @type {string}
             */
            vm.title = "";

            vm.icons = IconImagesService.mainActionIcons;

            vm.type = type;

            vm.getItems(vm.currentLimit, vm.currentOffset);

        };
        vm.getItems = function (limit, offset) {
            if (WorkbenchElementsTranslationsService.modelNameToContentType[vm.type]) {
                // build title of modal dialog
                vm.title = gettextCatalog.getString("Trashed ") + WorkbenchElementsTranslationsService.modelNameToTranslationPlural[vm.type];

                /**
                 * Injected REST Service
                 */
                var restSearchResource = TrashedItemsRestServiceFactory(vm.type);

                // if no limit is defined, use the default ``changesPerPage``
                if (limit === undefined) {
                    limit = itemsPerPage;
                }
                // if no offset is defined, begin at 0
                if (offset === undefined) {
                    offset = 0;
                }
                /**
                 * Defines the filters for the REST API for recent changes
                 * @type {{limit: *, offset: *, model: (undefined|*)}}
                 */
                var filters = {limit: limit, offset: offset};

                // query all trashed/deleted elements
                restSearchResource.query(filters).$promise.then(
                    function success (response) {
                        vm.objectList = response;
                        var count = response.$httpHeaders(PaginationCountHeader.getHeaderName());

                        if (count) {
                            vm.numberOfItems = count;
                        }
                        vm.itemsLoaded = true;
                    },
                    function error (rejection) {
                        console.log(rejection);
                        toaster.pop('error', gettextCatalog.getString("Failed to load data"));
                    }
                );
            } else {
                console.error("In displayTrashedItemsWidget: Could not find entityType " + vm.type);
            }
        };
        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * itemsPerPage;
            vm.currentLimit = itemsPerPage;

            vm.getItems(vm.currentLimit, vm.currentOffset);
        };

        vm.close = function () {
            $uibModalInstance.close();
        };

        //is triggered when an element was deleted (genericDeleteMenu.js)
        $scope.$on('objectDeletedEvent', function () {
            // check if this was the last element  on this page and if the currentPage isn't the 1st page
            // and change to the actual last page
            if (vm.objectList.length === 0 && vm.currentPage !== 1) {
                vm.currentPage -= 1;
                vm.currentOffset -= itemsPerPage;
            }

            vm.getItems(vm.currentLimit, vm.currentOffset);
        });
        //is triggered when an element was trashed (genericDeleteMenu.js)
        $scope.$on('objectRestoredEvent', function () {
            // check if this was the last element on this page and change to the actual last page
            if (vm.objectList.length === 1) {
                vm.currentPage -= 1;
                vm.currentOffset -= itemsPerPage;
            }

            vm.getItems(vm.currentLimit, vm.currentOffset);
        });
    });
})();
