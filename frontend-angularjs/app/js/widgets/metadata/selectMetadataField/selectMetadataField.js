/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Provides a select field to choose a metadata field.
     */
    module.directive('selectMetadataField', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/metadata/selectMetadataField/selectMetadataField.html',
            controller: 'SelectMetadataFieldController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                field: '=',
                readOnly: '<',
                allowCreate: '<'
            }
        }
    });

    module.controller('SelectMetadataFieldController', function (
        $scope,
        gettextCatalog,
        MetadataFieldService,
        MetadataFieldCreateModalService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.selectizeConfig = {
                labelField: 'name',
                valueField: 'pk',
                sortField: 'name',
                placeholder: gettextCatalog.getString("Select Field"),
                maxItems: 1
            };

            if (vm.allowCreate) {
                // handle inline item creation asynchronously
                vm.selectizeConfig['create'] = function (input, addCreatedItem) {
                    if (vm.allowCreate) {
                        MetadataFieldCreateModalService.open(input);

                        // the selectize input will freeze if the callback is not called,
                        // therefore call the callback in any case
                        // (adding the new field is handled via MetadataFieldService anyway)
                        addCreatedItem(null);
                    }
                }
            }

            vm.fieldList = MetadataFieldService.fields;

            MetadataFieldService.onFieldsLoaded(function () {
                vm.fieldList = MetadataFieldService.fields;
            });
        };

    });
})();
