/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * @ngdoc component
     *
     * @name driveTableView
     *
     * @memberOf module:screens
     *
     * @description
     * Shows all the drives as a table/list view
     */
    module.component('driveTableView', {
        templateUrl: 'js/screens/drive/driveTableView.html',
        controller: 'DriveTableViewController',
        controllerAs: 'vm',
        bindings: {
            'drives': '<'
        }
    });

    /**
     * Controller for drive list as cards
     */
    module.controller('DriveTableViewController', function (
        IconImagesService
    ) {
        "ngInject";

        var vm = this;

        vm.collapseDrive = {};

        vm.renderDrive = {};

        vm.toggleShowDrive = function (pk) {
            vm.collapseDrive[pk] = !vm.collapseDrive[pk];
        };

        vm.isExpanding = function (pk) {
            vm.renderDrive[pk] = true;
        };

        vm.hasCollapsed = function (pk) {
            vm.renderDrive[pk] = false;
        };

        vm.driveIcon = IconImagesService.mainElementIcons.drive;

    });
})();
