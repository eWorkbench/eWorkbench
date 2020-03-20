/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * render the tooltip of an calendar element
     */
    module.directive('calendarTooltipWidget', function () {
        return {
            restrict: 'A',
            templateUrl: 'js/widgets/calendarTooltipWidget/calendarTooltipWidget.html',
            controller: 'CalendarTooltipWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                event: '=?',
                meeting: '=?',
                task: '=?',
                resourcebooking: '=?'
            }
        }
    });

    module.controller('CalendarTooltipWidgetController', function () {
        'ngInject';
    });
})();
