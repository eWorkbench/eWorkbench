/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.directive('metadataFieldSelectionTypeSettings', function () {
        'ngInject';

        return {
            templateUrl: 'js/screens/metadata/createFieldModal/selection.html',
            restrict: 'E',
            bindToController: true,
            controllerAs: 'vm',
            controller: "MetadataFieldSelectionTypeSettingsController",
            scope: {
                typeSettings: '=',
                errors: '<'
            }
        };
    });

    module.controller('MetadataFieldSelectionTypeSettingsController', function () {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            // create 3 initial answer fields
            vm.typeSettings.answers = [null, null, null];
            vm.answers = vm.typeSettings.answers;
        };

        vm.addAnswer = function () {
            vm.answers.push(null);
        };

        vm.removeAnswer = function (answer) {
            var index = vm.answers.indexOf(answer);

            if (index >= 0) {
                vm.answers.splice(index, 1);
            }
        };

    })
})();
