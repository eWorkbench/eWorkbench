/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('displayProjectRolesWidget', function () {
        return {
            'restrict': 'E',
            'templateUrl': 'js/widgets/projectRole/displayProjectRoles.html',
            'bindToController': true,
            'controllerAs': 'vm',
            'controller': 'DisplayProjectRolesWidgetController',
            'scope': {
                'project': '='
            }
        }
    });

    module.controller('DisplayProjectRolesWidgetController', function (
        $scope,
        $q,
        AuthRestService,
        ProjectRoleUserAssignmentRestServiceFactory,
        RolesRestService,
        addNewUserModalDialogService,
        gettextCatalog,
        toaster
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * List of roles
             * @type {Array}
             */
            vm.roles = [];

            /**
             * The default role of the project manager
             * @type {undefined}
             */
            vm.defaultRoleProjectManager = undefined;

            /**
             * The default role with no access
             * @type {undefined}
             */
            vm.defaultRoleNoAccess = undefined;

            /**
             * The currently logged in user
             * @type {undefined}
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * Project Role User Assignments for the current project
             * @type {Array}
             */
            vm.projectRoleUserAssignments = [];

            /**
             * The Project Role User Assignment Rest Service
             */
            vm.projectRoleUserAssignmentRestService = ProjectRoleUserAssignmentRestServiceFactory(vm.project.pk);

            /**
             * Whether or not the current user can edit roles of this project
             * @type {boolean}
             */
            vm.canEditRoles = false;

            /**
             * Whether or not the current user can add roles of this project
             * @type {boolean}
             */
            vm.canAddRoles = false;

            /**
             * Whether or not the current user can delete roles of this project
             * @type {boolean}
             */
            vm.canDeleteRoles = false;

            /**
             * Whether or not the current user can view the roles of this project
             * @type {boolean}
             */
            vm.canViewRoles = false;

            /**
             * Whether or not the current user can edit the project details of this project
             * @type {boolean}
             */
            vm.canEditProject = false;

            /**
             * Whether or not the current user can edit the project storage space requirements
             * @type {boolean}
             */
            vm.canEditProjectStorageSpaceRequirements = false;

            /**
             * Whether or not the current user can invite external users via their e-mail address
             * @type {boolean}
             */
            vm.canInviteExternalUsers = false;

            $q.when()
                .then(checkProjectPermissionsOfCurrentUser)
                .then(getRoles)
                .then(getProjectRoleUserAssignments);
        };

        vm.addMember = function () {
            addNewUserModalDialogService.openModal(
                vm.project, vm.projectRoleUserAssignments, vm.projectRoleUserAssignmentRestService
            );
        };

        var checkProjectPermissionsOfCurrentUser = function () {
            // check edit permissions of project
            if (vm.project.current_users_project_permissions_list.indexOf('projects.change_project') >= 0) {
                vm.canEditProject = true;
            }

            // check edit permission of roles
            if (vm.project.current_users_project_permissions_list.indexOf(
                'projects.change_projectroleuserassignment') >= 0) {
                vm.canEditRoles = true;
            }
            // check delete permission of roles
            if (vm.project.current_users_project_permissions_list.indexOf(
                'projects.delete_projectroleuserassignment') >= 0) {
                vm.canDeleteRoles = true;
            }
            // check add permission of roles
            if (vm.project.current_users_project_permissions_list.indexOf(
                'projects.add_projectroleuserassignment') >= 0) {
                vm.canAddRoles = true;
            }
            // check view permission of roles
            if (vm.project.current_users_project_permissions_list.indexOf(
                'projects.view_projectroleuserassignment') >= 0) {
                vm.canViewRoles = true;
            }

            // check if the current user is allowed to invite external users
            if (vm.currentUser.permissions.indexOf('projects.invite_external_user') >= 0) {
                vm.canInviteExternalUsers = true;
            }
        };

        /**
         * Get all roles
         */
        var getRoles = function () {
            RolesRestService.query().$promise.then(
                function success (response) {
                    // iterate over roles and determine the default roles for PM and no access
                    for (var i = 0; i < response.length; i++) {
                        var role = response[i];

                        if (role.default_role_on_project_create == true) {
                            vm.defaultRoleProjectManager = role;
                        }
                        if (role.default_role_on_project_user_assign == true) {
                            vm.defaultRoleNoAccess = role;
                        }
                    }

                    vm.roles = response;
                }
            );
        };


        /**
         * Gets the project role user assignment for the current project
         */
        var getProjectRoleUserAssignments = function () {
            return vm.projectRoleUserAssignmentRestService.queryCached().$promise.then(
                function success (response) {
                    vm.projectRoleUserAssignments = response;
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Could not load project role user assignments"));
                }
            );
        };
    });
})();
