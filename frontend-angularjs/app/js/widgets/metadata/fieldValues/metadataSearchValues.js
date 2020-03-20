/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets'),
        datePickerOptions = {
            widgetPositioning: {horizontal: 'right', vertical: 'bottom'},
            allowInputToggle: true,
            showTodayButton: true
        };

    /**
     * Displays a metadata value.
     */
    module.directive('metadataSearchValues', function () {
        return {
            restrict: 'E', // as element only
            templateUrl: 'js/widgets/metadata/fieldValues/metadataFieldValues.html',
            controller: 'MetadataSearchValuesController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                // = ... two-way binding
                // < ... input only (one way binding)
                // @ ... constant string
                metadata: '=',
                readOnly: '<'
            }
        }
    });

    module.controller('MetadataSearchValuesController', function (
        $scope,
        MetadataService,
        MetadataFieldService,
        CalendarConfigurationService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.fieldBaseType = null;
            vm.field = null;
            vm.datePickerOptions = CalendarConfigurationService.getOptions(datePickerOptions);
        };

        $scope.$watch('vm.metadata.field', function () {
            vm.metadata.values = {};

            vm.field = MetadataFieldService.getField(vm.metadata.field);
            MetadataService.initializeSelectionOptions(vm.metadata, vm.field);
        });

    });
})();
