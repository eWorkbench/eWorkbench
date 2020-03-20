/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * Widget for selecting one or many projects within a tree
     */
    module.directive('resourceAvailabilityWidget', function () {
        return {
            templateUrl: 'js/widgets/resourceAvailabilityWidget/resourceAvailabilityWidget.html',
            controller: 'ResourceAvailabilityWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                placeholder: "@",
                maxItems: '=',
                selectedAvailabilityStart: '=?',
                selectedAvailabilityStop: '=?'
            }
        }
    });

    module.controller('ResourceAvailabilityWidgetController', function (
        $scope,
        $timeout,
        IconImagesService,
        CalendarConfigurationService
    ) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            /**
             * DatePicker Options
             * @type {
                 * {format: string,
                 *  widgetPositioning: {horizontal: string, vertical: string},
                 *  allowInputToggle: boolean, showTodayButton: boolean}
                 * }
             */
            var datePickerOptions = CalendarConfigurationService.getOptions({
                widgetPositioning: {horizontal: 'right', vertical: 'bottom'},
                allowInputToggle: true,
                showTodayButton: true
            });

            /**
             * gets the correct alert icon
             */
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            // copy date picker options for start date and stop date
            vm.datePickerOptionsStartDate = angular.copy(datePickerOptions);
            vm.datePickerOptionsStopDate = angular.copy(datePickerOptions);
        };

        /**
         * On any change of start_date, adapt stop_date
         * This is accomplished by calculating the time difference in minutes from the original start_date and the new
         * start_date, and adding exactly that value to stop_date
         */
        $scope.$watch('vm.selectedAvailabilityStart', function (newVal, oldVal) {
            if (vm.selectedAvailabilityStart) {
                // due_date needs to have a min_date of the current date
                vm.datePickerOptionsStopDate.minDate = vm.selectedAvailabilityStart;

                // calculate the difference in minutes between the old value and new value of start_date
                var diffMinutes = moment(newVal).diff(moment(oldVal), 'minutes');

                // apply this difference to the due_date
                $timeout(function () {
                    vm.selectedAvailabilityStop = moment(vm.selectedAvailabilityStop).add(diffMinutes, 'minutes');
                });
            }
        });
    });
})();
