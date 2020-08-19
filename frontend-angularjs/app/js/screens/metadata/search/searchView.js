/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Screen for searching metadata and showing the results.
     */
    module.component('metadataSearchView', {
        templateUrl: 'js/screens/metadata/search/searchView.html',
        controller: 'MetadataSearchViewController',
        controllerAs: 'vm',
        bindings: {}
    });

    module.controller('MetadataSearchViewController', function (
        $scope,
        $location,
        WorkbenchElementsTranslationsService,
        MetadataSearchRestService,
        NavigationService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.results = null;
            vm.errors = {};
            vm.newParameterField = null;
            vm.parameterList = [];

            vm.modelTypeFilter = null;
            vm.modelTypes = WorkbenchElementsTranslationsService.contentTypeToModelName;
            vm.modelNameToTranslation = WorkbenchElementsTranslationsService.modelNameToTranslation;
        };

        /**
         * Add new parameter when field is chosen.
         */
        $scope.$watch('vm.newParameterField', function (newVal, oldVal) {
            if (vm.newParameterField != null) {
                vm.parameterList.push({
                    'field': vm.newParameterField,
                    'values': {},
                    'values.answers': [],
                    'operator': '=',
                    'combinationOperator': 'AND'
                });
                vm.newParameterField = null;
            }
        });

        vm.removeParameter = function (parameter) {
            var index = vm.parameterList.indexOf(parameter);

            vm.parameterList.splice(index, 1);
        };

        var buildSearchRequestData = function () {
            var orCombinations = [],
                andCombinations = [];

            orCombinations.push(andCombinations);

            for (var i = 0; i < vm.parameterList.length; i++) {
                var parameter = vm.parameterList[i];

                andCombinations.push({
                    parameter_index: i,
                    field: parameter.field,
                    operator: parameter.operator,
                    values: parameter.values
                });

                // if there is an or-combination (that is not on the last parameter) -> start new and-combination
                if (parameter.combinationOperator === 'OR' && i < vm.parameterList.length - 1) {
                    andCombinations = [];
                    orCombinations.push(andCombinations);
                }
            }

            return {
                'content_type': vm.modelTypeFilter,
                'parameters': orCombinations
            };
        };

        vm.search = function () {
            // Clear results before showing new results,
            // so the user can see the search was processed, even if the results stay the same
            vm.results = null;

            var requestData = buildSearchRequestData();

            // query the API
            MetadataSearchRestService.resource.search(requestData).$promise.then(
                function success (response) {
                    vm.results = response;

                    // add modelView URL and typeDisplay to results
                    for (var i = 0; i < vm.results.length; i++) {
                        var entity = vm.results[i],
                            modelName = WorkbenchElementsTranslationsService.contentTypeToModelName[
                                entity.content_type_model];

                        entity.modelViewUrl = NavigationService.getModelViewUrl(entity);
                        console.log('#entity', entity)
                        entity.typeDisplay = WorkbenchElementsTranslationsService.modelNameToTranslation[modelName];
                    }

                    vm.errors = {};
                },
                function error (response) {
                    vm.errors = response.data;
                }
            );
        };

        vm.goToResult = function (entity) {
            NavigationService.goToModelView(entity);
        };

    });
})();
