/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');


    module.service('addNewUserModalDialogService', function ($uibModal) {
        var service = {};

        service.openModal = function (project, projectRoleUserAssignments, projectRoleUserAssignmentRestService) {
            return $uibModal.open({
                templateUrl: 'js/screens/project/inviteNewUserDialog.html',
                controller: 'AddNewUserModalDialogController',
                controllerAs: 'vm',
                resolve: {
                    'project': function () {
                        return project;
                    },
                    'projectRoleUserAssignments': function () {
                        return projectRoleUserAssignments;
                    },
                    'projectRoleUserAssignmentRestService': function () {
                        return projectRoleUserAssignmentRestService;
                    }
                }
            });
        };

        return service;
    });

    /**
     * Dialog for adding a new user to a project
     */
    module.controller('AddNewUserModalDialogController', function (
        $uibModalInstance,
        $q,
        RolesRestService,
        UserRestService,
        toaster,
        gettextCatalog,
        // resolved variables
        project,
        projectRoleUserAssignments,
        projectRoleUserAssignmentRestService
    ) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            /**
             * Search value
             * @type {string}
             */
            vm.searchValue = '';

            /**
             * A dictionary of errors returned from the API
             * @type {Array}
             */
            vm.errors = {};

            vm.project = project;

            vm.projectRoleUserAssignments = projectRoleUserAssignments;

            vm.projectRoleUserAssignmentRestService = projectRoleUserAssignmentRestService;

            vm.selectedUserPk = undefined;

            vm.inviteExternalUser = false;

            getRoles();
        };

        /**
         * Checks whether the selected user has already been added
         * @param user_pk
         * @returns {boolean}
         */
        var userAlreadyAdded = function (user_pk) {
            for (var i = 0; i < vm.projectRoleUserAssignments.length; i++) {
                if (vm.projectRoleUserAssignments[i].user_pk == user_pk) {
                    return true;
                }
            }

            return false;
        };

        var addUserToProject = function (user) {
            // check if user is already added
            if (userAlreadyAdded(user)) {
                toaster.pop('warning', gettextCatalog.getString("This user has already been added"));

                return $q.when();
            }

            var assignment = {
                user_pk: user,
                role: vm.defaultRoleNoAccess
            };

            return vm.projectRoleUserAssignmentRestService.create(assignment).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("User added"));
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to add user to project"));
                    console.log(rejection);
                }
            );
        };

        /**
         * Get roles from REST API
         * marks the default role on project create and for new users
         */
        var getRoles = function () {
            return RolesRestService.queryCached().$promise.then(
                function success (response) {
                    vm.roles = response;

                    angular.forEach(response, function (role) {
                        if (role.default_role_on_project_create == true) {
                            vm.defaultRoleProjectManager = role;
                        }
                        if (role.default_role_on_project_user_assign == true) {
                            vm.defaultRoleNoAccess = role;
                        }
                    });
                }
            );
        };

        vm.toggleInvite = function () {
            vm.inviteExternalUser = !vm.inviteExternalUser;
        };

        /**
         * Click on invite button - creates a new user via REST
         */
        vm.doAdd = function () {
            // reset errors
            vm.errors = {};

            if (!vm.inviteExternalUser) {
                addUserToProject(vm.selectedUserPk).then(
                    function () {
                        $uibModalInstance.close();
                    }
                );
            } else {

                // invite this user via REST API
                var data = {
                    email: vm.email,
                    message: vm.text
                };

                UserRestService.resource.inviteUser(data).$promise.then(
                    function success (response) {
                        console.log("User registered");
                        toaster.pop('success', "User invited");

                        addUserToProject(response.pk).then(
                            function () {
                                $uibModalInstance.close();
                            }
                        );
                    },
                    function error (rejection) {
                        console.log("Failed to invite this user");
                        console.log(rejection);
                        if (rejection.data) {
                            vm.errors = rejection.data;
                        } else {
                            toaster.pop('error', "Failed to invite user");
                        }
                    }
                );
            }
        };

        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
