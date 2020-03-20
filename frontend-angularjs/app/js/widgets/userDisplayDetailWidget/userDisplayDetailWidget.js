/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Displays user detail view
     */

    module.controller('userDisplayDetailWidgetController', function ($uibModalInstance, user) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.user = user;
            /**
             * deactivate 'edit user profile' button
             * @type {boolean}
             */
            vm.isWidget = true;

            /**
             * define the bootstrap grid columns
             * @type {string}
             */
            vm.cssBootstrapGridColumnClassesLabel = "col-sm-4 col-md-12 col-lg-6";
            vm.cssBootstrapGridColumnClassesContent = "col-sm-8 col-md-12 col-lg-6";
        };

        vm.close = function () {
            $uibModalInstance.close();
        };
    });
})();
