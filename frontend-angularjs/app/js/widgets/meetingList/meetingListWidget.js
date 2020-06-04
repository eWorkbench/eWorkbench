/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    module.directive('meetingListWidget', function () {
        return {
            templateUrl: 'js/widgets/meetingList/meetingListWidget.html',
            controller: 'MeetingListWidget',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                date: '<',
                meetings: '<',
                editCallback: '<'
            }
        }
    });

    module.controller('MeetingListWidget', function (IconImagesService) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            vm.meetingIcon = IconImagesService.mainElementIcons.meeting;
        };

        console.log('Appointment List Controller');
    });
})();
