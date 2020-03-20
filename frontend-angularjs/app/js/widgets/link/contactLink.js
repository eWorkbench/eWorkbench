/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    /**
     * A directive which formats a userDisplay object coming from the REST API
     */
    module.directive('contactLink', function () {
        return {
            templateUrl: 'js/widgets/link/contactLink.html',
            controller: "contactLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                contact: '='
            }
        }
    });

    module.controller('contactLinkController', function (
        $scope,
        $state
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch contact and generate an URL for the given contact
         */
        $scope.$watch("vm.contact", function () {
            if (vm.contact) {
                vm.contactUrl = $state.href("contact-view", {contact: vm.contact});
            } else {
                vm.contactUrl = "";
            }
        });
    });
})();
