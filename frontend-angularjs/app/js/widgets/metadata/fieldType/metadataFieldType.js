/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Displays a metadata field type.
     */
    module.directive('metadataFieldType', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/metadata/fieldType/metadataFieldType.html',
            controller: 'MetadataFieldTypeController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                metadata: '='
            }
        }
    });

    module.controller('MetadataFieldTypeController', function (
        MetadataFieldService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.fieldName = '';

            MetadataFieldService.onFieldsLoaded(function () {
                var fieldPk = vm.metadata.field,
                    field = MetadataFieldService.fieldMap[fieldPk];

                vm.fieldName = (field) ? field.name : fieldPk;
            });
        };

    });
})();
