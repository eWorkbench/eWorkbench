/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.service('objectPrivilegesReallyDeleteModalService', function ($uibModal) {
        "ngInject";

        return {
            'open': function (privilege) {
                return $uibModal.open({
                    templateUrl: 'js/screens/objectPrivileges/objectPrivilegesModalView.reallyDelete.html',
                    controller: 'ObjectPrivilegesReallyDeleteModalController',
                    controllerAs: 'vm',
                    resolve: {
                        privilege: function () {
                            return privilege;
                        }
                    }
                });
            }
        }
    });

    module.controller('ObjectPrivilegesReallyDeleteModalController', function (
        $scope,
        $uibModalInstance,
        AuthRestService,
        privilege
    ) {
        var vm = this;

        this.$onInit = function () {
            vm.currentUser = AuthRestService.getCurrentUser();
            vm.privilege = privilege;
        };

        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };

        vm.confirm = function () {
            $uibModalInstance.close();
        };
    });
})();
