/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A directive which formats a userDisplay object coming from the REST API
     */
    module.directive('pictureLink', function () {
        return {
            templateUrl: 'js/widgets/link/pictureLink.html',
            controller: "PictureLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                picture: '='
            }
        }
    });

    module.controller('PictureLinkController', function (
        $scope,
        $state
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch Picture and generate an URL for the given picture
         */
        $scope.$watch("vm.picture", function () {
            if (vm.picture) {
                vm.pictureUrl = $state.href("picture-view", {picture: vm.picture});
            } else {
                vm.pictureUrl = "";
            }
        });
    });
})();
