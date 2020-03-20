/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Widget that shows the element state (mainly, whether the element has been trashed or not)
     */
    module.directive('genericShowElementStateWidget', function () {
        return {
            restrict: 'E',
            controller: 'GenericShowElementStateWidgetController',
            templateUrl: 'js/widgets/genericShowElementStateWidget/genericShowElementStateWidget.html',
            scope: {
                baseModel: '=',
                showTrashed: '='
            },
            replace: true,
            bindToController: true,
            controllerAs: 'vm'
        };
    });

    module.controller('GenericShowElementStateWidgetController', function (
        $scope
    ) {
        "ngInject";

        // var vm = this;
    });
})();
