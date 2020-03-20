/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Service to open a ChooseExistingFiles modal.
     */
    module.service('ChooseExistingFilesModalService', function ($uibModal) {
        "ngInject";

        var service = {};

        /**
         * Opens the modal.
         * @returns {*}
         */
        service.open = function () {
            return $uibModal.open({
                backdrop: 'static',
                templateUrl: 'js/screens/drive/chooseExistingFilesModal.html',
                controller: 'ChooseExistingFilesModalController',
                controllerAs: 'vm',
                size: 'lg'
            });
        };

        return service;
    });

    /**
     * Shows existing files that can be added to a storage.
     */
    module.controller('ChooseExistingFilesModalController', function (
        $uibModalInstance,
        $scope,
        gettextCatalog,
        toaster,
        IconImagesService,
        FileRestService,
        WorkbenchElementsTranslationsService,
        GenericSearchService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.searchResource = FileRestService.resource.search;
            vm.searchResult = [];
            vm.selectedItem = null;
            vm.searching = false;
            vm.waitingIcon = IconImagesService.searchElementIcons.waiting;
            vm.noResultIcon = IconImagesService.searchElementIcons.noResult;
            vm.columns = [
                {
                    'title': 'File',
                    'field': 'name',
                    'display': "{{ $result['name'] }}"
                },
                {
                    'title': 'Created by',
                    'field': 'created_by.username',
                    'display': '<user-display-widget user="$result[\'created_by\']"></user-display-widget>'
                },
                {
                    'title': 'Created at',
                    'field': 'created_at',
                    'display': "{{ $result['created_at'] |smallDate }}"
                }
            ];

            // create titles for the defined columns
            for (var i = 0; i < vm.columns.length; i++) {
                var column = vm.columns[i];

                column.title = WorkbenchElementsTranslationsService.translateFieldName('file', column.field);
            }
        };

        /**
         * Searches for the given string using the specified search resource.
         * @param searchString
         */
        vm.search = function (searchString) {
            vm.searching = true;
            vm.selectedItem = null;

            GenericSearchService.search(vm.searchResource, searchString).$promise.then(
                function success (response) {
                    vm.searchResult = response;
                    vm.searching = false;
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Search failed"));
                    console.log(rejection);
                    vm.searchResult = [];
                    vm.searching = false;
                }
            );
        };

        /**
         * Resets the search inputs and outputs.
         */
        vm.cancelSearch = function () {
            vm.searching = false;
            vm.searchResult = [];
            vm.selectedItem = null;

            vm.search("");
        };

        /**
         * Sets the selected item if it is a valid choice. Called from angular HTML code.
         * @param file
         */
        vm.setSelectedItem = function (file) {
            if (!file.directory_id) {
                vm.selectedItem = file;
            }
        };

        /**
         * Submits the currently selected item. Called via 'add' button.
         */
        vm.submit = function () {
            $uibModalInstance.close(vm.selectedItem);
        };

        /**
         * Dismisses the modal.
         */
        vm.cancel = function () {
            $uibModalInstance.dismiss();
        };

        /**
         * Starts an empty search once the search-resource is loaded (displays recently modified elements).
         */
        $scope.$watch("vm.searchResource", function () {
            vm.search("");
        });
    });
})();
