/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Displays the available operators for a metadata field: [=, <, <=, >, >=].
     */
    module.directive('metadataFieldOperator', function () {
        return {
            restrict: 'E', // as element only
            templateUrl: 'js/widgets/metadata/fieldOperator/metadataFieldOperator.html',
            controller: 'MetadataFieldOperatorController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                // = ... two-way binding
                // < ... input only (one way binding)
                // @ ... constant string
                field: '<',
                readOnly: '<',
                ngModel: '='
            }
        }
    });

    module.controller('MetadataFieldOperatorController', function (
        $scope,
        MetadataBaseTypes,
        MetadataFieldService
    ) {
        'ngInject';

        var vm = this;

        /**
         * Reload operators for changed field.
         */
        $scope.$watch('vm.field', function () {
            loadOperators();
        });

        var loadOperators = function () {
            var fieldPk = vm.field,
                baseType = MetadataFieldService.getBaseType(fieldPk);

            vm.options = baseType ? baseType.operators : [];

            // set initial operator
            vm.ngModel = (vm.options.length > 0) ? vm.options[0] : null;
        };
    });
})();
