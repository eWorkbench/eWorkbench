/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.component('cmsView', {
        templateUrl: 'js/screens/cms/cmsView.html',
        controller: 'CmsViewController',
        controllerAs: 'vm',
        bindings: {
            'slug': '='
        }
    });

    module.controller('CmsViewController', function (
        $scope,
        $http,
        restApiUrl
    ) {
        "ngInject";

        var vm = this;

        vm.$content = "";

        $scope.$watch("vm.slug", function () {
            $http.get(restApiUrl + "cms/" + vm.slug + "/").then(
                function success (response) {
                    vm.content = response.data;
                }
            );
        });
    });
})();
