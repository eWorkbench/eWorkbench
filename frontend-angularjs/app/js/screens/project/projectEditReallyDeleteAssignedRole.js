/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service that provides a method for opening the modal dialog with the
     * ProjectEditReallyDeleteAssignedRoleController controller
     */
    module.service('projectRoleEditConfirmationDialogService', function ($uibModal) {
        var service = {};

        service.openModal = function (questionType, assignment) {
            var templateUrl = '';

            if (questionType == "reallyChangeOwnRole") {
                templateUrl = 'js/screens/project/projectEditReallyChangeOwnRole.html';
            } else if (questionType == "reallyDeleteAssignedRole") {
                templateUrl = 'js/screens/project/projectEditReallyDeleteAssignedRole.html';
            } else {
                console.error("Unknown questionType " + questionType);

                return false;
            }

            return $uibModal.open({
                templateUrl: templateUrl,
                controller: 'ProjectEditReallyDeleteAssignedRoleController',
                controllerAs: 'vm',
                resolve: {
                    assignment: function () {
                        return assignment;
                    }
                }
            });
        };

        return service;
    });


    module.controller('ProjectEditReallyDeleteAssignedRoleController', function (
        $uibModalInstance,
        AuthRestService,
        assignment
    ) {
        'ngInject';

        var
            vm = this;

        vm.assignment = assignment;
        vm.delete_own_user = false;
        vm.auth_user_pk = AuthRestService.getCurrentUser().pk;

        vm.cancel = function () {
            $uibModalInstance.dismiss();
        };

        vm.yesDelete = function () {
            $uibModalInstance.close(true);
        };

        vm.yesInactive = function () {
            $uibModalInstance.close(false);
        };
    });
})();