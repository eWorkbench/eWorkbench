/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('dashboardContacts', {
        templateUrl: 'js/widgets/dashboardWidgets/dashboardContacts.html',
        controller: 'DashboardContactsController',
        controllerAs: 'vm',
        bindings: {
            contacts: '<',
            isLoading: '<'
        },
        bindToController: true
    });

    /**
     * Main Controller
     *
     * Displays the mainDashboard overview page
     */
    module.controller('DashboardContactsController', function (
        IconImagesService,
        contactCreateModalService
    ) {
        'ngInject';

        var
            vm = this;

        vm.contactIcon = IconImagesService.mainElementIcons.contact;
        vm.emailIcon = IconImagesService.genericIcons.email;

        vm.createNewContact = function () {
            var modal = contactCreateModalService.open();

            modal.result.then(contactCreateModalService.viewElement);
        };
    });
})();
