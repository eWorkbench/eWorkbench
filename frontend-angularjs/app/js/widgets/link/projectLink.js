/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    /**
     * A directive which formats a userDisplay object coming from the REST API
     */
    module.directive('projectLink', function () {
        return {
            templateUrl: 'js/widgets/link/projectLink.html',
            controller: 'ProjectLinkController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                project: '=?',
                projectPk: '=?',
                edit: "=",
                extraPath: "=?"
            }
        }
    });

    module.controller('ProjectLinkController', function ($scope, ProjectRestService, IconImagesService) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            /**
             * gets the correct edit icon
             */
            vm.editIcon = IconImagesService.mainActionIcons.edit;

            /**
             * Whether or not the project was found
             * @type {boolean}
             */
            vm.projectNotFound = false;
        };

        $scope.$watch("vm.projectPk", function (newVal, oldVal) {
            if (vm.projectPk) {
                /**
                 * query project
                 */
                vm.projectNotFound = false;

                ProjectRestService.getCached({pk: vm.projectPk}).$promise.then(
                    function success (response) {
                        vm.project = response;
                    },
                    function error (rejection) {
                        vm.projectNotFound = true;
                        vm.project = null;
                    }
                );
            } else if (newVal == null && oldVal != null) {
                vm.project = null;
            }
        });
    });
})();
