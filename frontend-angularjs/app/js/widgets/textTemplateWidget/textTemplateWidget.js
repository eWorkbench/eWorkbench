/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * A directive which display a template symbol to select a texttemplate
     */
    module.directive('textTemplateWidget', function () {
        return {
            templateUrl: 'js/widgets/textTemplateWidget/textTemplateWidget.html',
            controller: 'TextTemplateWidgetWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                overrideObjectAttribute: '='
            }
        };
    });

    module.controller('TextTemplateWidgetWidgetController', function (
        TextTemplatesRestService,
        toaster,
        gettextCatalog
    ) {
        'ngInject';

        var
            vm = this;

        /**
         * Query Text Templates
         */
        vm.getTextTemplates = function () {
            return TextTemplatesRestService.queryCached().$promise.then(
                function success (response) {
                    vm.texttemplates = response;
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Could not load text templates"));
                }
            );
        };

        vm.getTextTemplates();

        /**
         * get selected Text Template and load it into the content field
         */
        vm.selectedTextTemplate = function (selectedObject) {
            vm.overrideObjectAttribute = selectedObject.content;
        };

    });
})();
