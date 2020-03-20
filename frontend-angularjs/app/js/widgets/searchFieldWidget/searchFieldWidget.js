/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name searchFieldWidget
     *
     * @restrict E
     *
     * @description
     * A directive for displaying a searchfield and handle the logic
     */
    module.directive('searchFieldWidget', function () {
        return {
            templateUrl: 'js/widgets/searchFieldWidget/searchFieldWidget.html',
            controller: 'SearchFieldWidgetController',
            controllerAs: 'vm',
            restrict: 'E',
            bindToController: true,
            scope: {
                doSearch: '&',
                cancelSearch : '&',
                searchInputLength: '=',
                debounce: '=',
                placeholder: '@?',
                initialSearchFieldValue: '@?' // the actual search field (optional, will be set to "" if empty)
            }
        }
    });

    /**
     * Controller for searchFieldWidget
     */
    module.controller('SearchFieldWidgetController', function (
        IconImagesService,
        gettextCatalog
    ) {
        "ngInject";

        var
            vm = this;

        this.$onInit = function () {
            if (typeof vm.initialSearchFieldValue !== "undefined") {
                vm.searchField = vm.initialSearchFieldValue;
            }

            /**
             * gets the correct search icons
             */
            vm.cancelIcon = IconImagesService.searchElementIcons.cancel;
            vm.searchIcon = IconImagesService.searchElementIcons.search;

            if (!vm.placeholder) {
                vm.placeholder = gettextCatalog.getString('Search');
            }
        };

        vm.searching = function () {
            vm.doSearch({searchString: vm.searchField});
        };

        vm.clearSearch = function () {
            vm.searchField = "";
            vm.cancelSearch({});
        };
    });
})();
