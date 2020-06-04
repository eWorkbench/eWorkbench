/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    module.directive('meetingListActionsWidget', function () {
        return {
            templateUrl: 'js/widgets/meetingListActions/meetingListActionsWidget.html',
            controller: 'MeetingListActionsWidget',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                date: '<',
                createCallback: '<'
            }
        }
    });

    module.controller('MeetingListActionsWidget', function (IconImagesService) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            vm.addIcon = IconImagesService.mainActionIcons.add;
        };

        console.log('Appointment List Actions Controller');
    });
})();
