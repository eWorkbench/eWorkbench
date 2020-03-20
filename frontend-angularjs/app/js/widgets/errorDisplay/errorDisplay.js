/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    module.component('errorDisplay', {
        templateUrl: 'js/widgets/errorDisplay/errorDisplay.html',
        controller: 'ErrorDisplayController',
        controllerAs: 'vm',
        bindings: {
            'error': '<?'
        }
    });

    module.controller('ErrorDisplayController', function (
        IconImagesService
    ) {
        'ngInject';

        var vm = this;

        vm.alertIcon = IconImagesService.mainWarningIcons.alert;
    });
})();
