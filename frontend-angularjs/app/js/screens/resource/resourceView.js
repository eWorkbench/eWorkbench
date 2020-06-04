/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    module.component('resourceView', {
        templateUrl: 'js/screens/resource/resourceView.html',
        controller: 'ResourceViewController',
        controllerAs: 'vm',
        bindings: {
            'resource': '<',
            'readOnly': '<'
        }
    });

    module.controller('ResourceViewController', function (
        $scope,
        $q,
        gettextCatalog,
        AuthRestService,
        ResourceRestService,
        ResourceConverterService,
        toaster,
        IconImagesService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.resourceIcon = IconImagesService.mainElementIcons.resource;
            vm.view = 'view';
            vm.currentUser = AuthRestService.getCurrentUser();
            vm.calendarConfig = {
                header: {
                    left: 'title bookresource',
                    center: '',
                    right: 'month agendaWeek today prev next export'
                },
                allDaySlot: false
            };
            vm.metaDataCollapsed = true;
            vm.selectedProjects = [];
            vm.users = [];
        };

        vm.switchToEditView = function () {
            vm.resource.$getCached();
            vm.view = 'edit';
            vm.resourceTypes = ResourceConverterService.resourceTypeTexts;
        };

        vm.switchToView = function () {
            vm.resource.$getCached();
            vm.view = 'view';
        };

        vm.cancel = function () {
            vm.switchToView();
        };

        /**
         * Toggles visibility of meta data
         * Default setting (closed or open) is determined in `this.$onInit = function () {  init();  };`
         */
        vm.toggleMetaDataVisibility = function () {
            vm.metaDataCollapsed = !vm.metaDataCollapsed;
        };
    });
})();
