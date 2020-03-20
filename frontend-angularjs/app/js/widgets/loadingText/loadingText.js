/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A directive for displaying a "loading ..." text
     */
    module.directive('loadingText', function () {
        return {
            restrict: 'E', // use only as HTML tag
            templateUrl: 'js/widgets/loadingText/loadingText.html',
            controller: 'LoadingTextController',
            controllerAs: 'vm',
            bindToController: true,
            transclude: true, // transclude name of loading element (e.g. "Tasks")
            scope: {
                loading: '<', // loading flag input
                showIcon: '<?' // optional input
            }
        }
    });

    module.controller('LoadingTextController', function (
        IconImagesService
    ) {
        "ngInject";

        var vm = this;

        vm.waitingIcon = IconImagesService.searchElementIcons.waiting;
    });

})();
