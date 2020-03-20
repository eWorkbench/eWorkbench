/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * A directive which displays a dmp status
     */
    module.directive('dmpStatusWidget', function () {
        return {
            templateUrl: 'js/widgets/dmpStatusWidget/dmpStatusWidget.html',
            controller: 'DmpStatusWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                dmpStatus: '='
            }
        }
    });

    module.controller('DmpStatusWidgetController', function (DmpStateService) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.dmpStatus = DmpStateService.dmpStates[vm.dmpStatus];
        };
    });
})();
