/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('dashboardNotes', {
        templateUrl: 'js/widgets/dashboardWidgets/dashboardNotes.html',
        controller: 'DashboardNotesController',
        controllerAs: 'vm',
        bindings: {
            notes: '<',
            isLoading: '<'
        },
        bindToController: true
    });

    /**
     * Main Controller
     *
     * Displays the mainDashboard overview page
     */
    module.controller('DashboardNotesController', function (
        IconImagesService,
        noteCreateModalService
    ) {
        'ngInject';

        var
            vm = this;

        vm.noteIcon = IconImagesService.mainElementIcons.note;

        vm.createNewNote = function () {
            var modal = noteCreateModalService.open();

            modal.result.then(noteCreateModalService.viewElement);
        };
    });
})();
