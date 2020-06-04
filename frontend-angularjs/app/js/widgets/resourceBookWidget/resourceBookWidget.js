/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A widget soft delete and restore icons
     */
    module.directive('resourceBookWidget', function () {
        return {
            'restrict': 'E',
            'controller': 'ResourceBookWidgetController',
            'templateUrl': 'js/widgets/resourceBookWidget/resourceBookWidget.html',
            'bindToController': true,
            'controllerAs': 'vm',
            'scope': {
                'resource': '=',
                'title': '@'
            }
        };
    });

    module.controller('ResourceBookWidgetController', function (
        $rootScope,
        ResourceBookingCreateEditModalService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {

        };

        /**
         * Book a resource
         */
        vm.bookResource = function () {
            // create a modal and wait for a result
            var modal = ResourceBookingCreateEditModalService.openCreate(null, vm.resource);

            modal.result.then().catch(
                function () {
                    console.log("Modal canceled");
                }
            );
        };
    });
})();
