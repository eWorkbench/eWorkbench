/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.service('taskAssignedUsersModalService', function ($uibModal) {
        "ngInject";

        return {
            'openModal': function (task) {
                return $uibModal.open({
                    templateUrl: 'js/screens/task/taskAssignedUsersModal.html',
                    controller: 'TaskAssignedUsersModalController',
                    resolve: {
                        task: function () {
                            return task;
                        }
                    }
                });
            }
        };
    });

    module.controller('TaskAssignedUsersModalController', function (
        $scope,
        $uibModalInstance,
        task
    ) {
        "ngInject";

        $scope.task = task;

        $scope.dismiss = function () {
            $uibModalInstance.dismiss();
        }
    });
})();
