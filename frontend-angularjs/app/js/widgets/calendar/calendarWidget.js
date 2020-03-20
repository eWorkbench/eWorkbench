/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    module.directive('calendarWidget', function () {
        return {
            templateUrl: 'js/widgets/calendar/calendarWidget.html',
            controller: 'CalendarWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                date: '=',
                options: '<'
            }
        }
    });

    module.controller('CalendarWidgetController', function (CalendarConfigurationService) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * init the calendar date with today if not set explicitly
             */
            if (!vm.date) {
                vm.date = moment();
            }

            /**
             * create default options object if not set explicitly
             */
            if (!vm.options) {
                vm.options = {
                    'inline': true,
                    'format': CalendarConfigurationService.dateFormats.shortFormat
                };
            }

            /**
             * get the calendar configuration from configuration service
             */
            vm.options = CalendarConfigurationService.getOptions(vm.options);

            console.log('Calender Controller');
        };
    });
})();
