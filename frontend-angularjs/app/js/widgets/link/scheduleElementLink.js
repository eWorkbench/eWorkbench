/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Widget that displays a link to edit a schedule element (appointment, task, resource booking).
     */
    module.directive('scheduleElementLink', function () {
        'ngInject';

        return {
            templateUrl: 'js/widgets/link/scheduleElementLink.html',
            restrict: 'E',
            bindToController: true,
            controllerAs: 'vm',
            controller: 'ScheduleElementLinkController',
            scope: {
                entity: '='
            }
        };
    });

    module.controller('ScheduleElementLinkController', function () {
        'ngInject';
    });
})();
