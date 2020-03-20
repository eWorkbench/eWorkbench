/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('dmpFormNameDisplayWidget', function () {
        return {
            'restrict': 'E',
            'templateUrl': 'js/widgets/dmpFormNameDisplay/dmpFormNameDisplay.html',
            'controller': 'DmpFormNameDisplayWidgetController',
            'controllerAs': 'vm',
            'bindToController': true,
            'scope': {
                'dmpForm': '=?',
                'dmpFormPk': '=?'
            }
        }
    });

    module.controller('DmpFormNameDisplayWidgetController', function (
        $scope,
        DmpFormsRestService
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * Whether or not the project was found
             * @type {boolean}
             */
            vm.dmpFormNotFound = false;
        };

        $scope.$watch('vm.dmpFormPk', function (newVal, oldVal) {
            if (vm.dmpFormPk) {
                /**
                 * Query DMP Form
                 */
                DmpFormsRestService.getCached({pk: vm.dmpFormPk}).$promise.then(
                    function success (response) {
                        vm.dmpForm = response;
                    },
                    function error (rejection) {
                        vm.dmpFormNotFound = true;
                        vm.dmpForm = null;
                    }
                )
            } else if (newVal == null && oldVal != null) {
                vm.dmpForm = null;
            }
        });
    });
})();
