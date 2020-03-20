/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('permissionDeniedCardWidget', function () {
        return {
            'restrict': 'E',
            'templateUrl': 'js/widgets/cardDisplay/permissionDeniedCard.html',
            'controller': 'PermissionDeniedCardWidgetController',
            'controllerAs': 'vm',
            'bindToController': true,
            transclude: {
                'cardFooter': '?cardFooter'
            },
            'scope': {
                relationContentobject: '<',
                relationContentTypeModel: '<',
                relation: "<"
            }
        }
    });

    module.controller('PermissionDeniedCardWidgetController',  function (
        toaster,
        IconImagesService
    ) {
        'ngInject';

        var
            vm = this;

        vm.alertIcon = IconImagesService.mainWarningIcons.alert;
    });
})();
