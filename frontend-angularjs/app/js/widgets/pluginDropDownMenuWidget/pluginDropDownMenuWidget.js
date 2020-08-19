/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * A directive which displays a plugin dropdown menu
     */
    module.directive('pluginDropDownMenuWidget', function () {
        return {
            templateUrl: 'js/widgets/pluginDropDownMenuWidget/pluginDropDownMenuWidget.html',
            controller: 'PluginDropDownMenuWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                plugin: '<',
                switchPluginView: '<',
                cssClass: '@'
            }
        }
    });

    module.controller('PluginDropDownMenuWidgetController', function (
        IconImagesService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * gets the correct icons
             */
            vm.emailIcon = IconImagesService.genericIcons.email;
        }

    });
})();
