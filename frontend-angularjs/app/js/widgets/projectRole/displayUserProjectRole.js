/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('displayUserProjectRoleWidget', function () {
        return {
            'restrict': 'E',
            'templateUrl': 'js/widgets/projectRole/displayUserProjectRole.html',
            'scope': {
                'project': '=',
                'assignment': '='
            },
            'bindToController': true,
            'controllerAs': 'vm',
            'controller': 'DisplayUserProjectRoleWidgetController'
        }
    });

    module.controller('DisplayUserProjectRoleWidgetController', function (
        $scope,
        $q,
        $timeout,
        $uibModal,
        AuthRestService,
        RolesRestService,
        ProjectRoleUserAssignmentRestServiceFactory,
        projectRoleEditConfirmationDialogService,
        toaster,
        gettextCatalog
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

            getRoles();
            $scope.$watch("vm.project", checkProjectRoleUserAssignmentPermissionsOfCurrentUser);
        };

        /**
         * Get all roles
         */
        var getRoles = function () {
            RolesRestService.queryCached().$promise.then(
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
         * Checks for Role Change Permissions within the project for the current user
         */
        var checkProjectRoleUserAssignmentPermissionsOfCurrentUser = function () {
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
        };

        /**
         * Update role assignment of a user
         * @param assignment
         * @param oldRole
         * @returns {*}
         */
        vm.updateAssignment = function (key, value) {
            // warn user if assignment of the currently logged in user is changed
            if (vm.assignment.user.pk == vm.currentUser.pk) {
                var modalInstance = projectRoleEditConfirmationDialogService.openModal(
                    "reallyChangeOwnRole", vm.assignment
                );

                // wait for result
                return modalInstance.result.then(
                    function confirm () {
                        // not the current user, just update it
                        return updateAssignmentViaRest(key, value);
                    },
                    function cancel () {
                        // user canceled it, so we just need to "reset" the object (with getCached) and then resolve
                        // the promise; the $timeout construct is necessary so data-binding / digest-cycles can do
                        // some work in the background...
                        return vm.assignment.$getCached().then($q.reject);
                    }
                );
            }

            // not the current user, just update it
            return updateAssignmentViaRest(key, value);
        };

        /**
         * Update assignment via REST API
         * @param assignment
         * @param oldRole
         */
        var updateAssignmentViaRest = function (key, value) {
            var data = {
                'pk': vm.assignment.pk
            };

            data[key] = value;

            return ProjectRoleUserAssignmentRestServiceFactory(vm.project.pk).updatePartial(data).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Role changed"));

                    return response;
                },
                function error (rejection) {
                    console.log(rejection);

                    if (rejection.status == 403) {
                        toaster.pop('error',
                            gettextCatalog.getString("Permission denied"),
                            gettextCatalog.getString("Failed to change role")
                        );
                    } else if (rejection.data && rejection.data.non_field_errors) {
                        // some logical error happened, print it
                        toaster.pop('error',
                            gettextCatalog.getString("Error"),
                            gettextCatalog.getString(rejection.data.non_field_errors.join(", "))
                        );
                    } else {
                        toaster.pop('error',
                            gettextCatalog.getString("Unknown error"),
                            gettextCatalog.getString("Failed to change role because of an unknown error")
                        );
                    }

                    // changing did not work, we want to reset the object here
                    vm.assignment.$getCached();

                    // also, we need to implicitly reject it so editable select list gets information that
                    // changing did not succeed
                    return $q.reject(rejection);

                }
            );
        };

        /**
         * On delete button click present a modal dialog that asks the user whether to really delete the role or not
         * @param assignment
         * @returns {*}
         */
        vm.deleteProjectRoleUserAssignment = function (assignment) {
            var modalInstance = projectRoleEditConfirmationDialogService.openModal(
                "reallyDeleteAssignedRole",
                vm.assignment
            );

            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        // really delete it!
                        assignment.$delete().then(
                            function success (response) {
                                toaster.pop('success',
                                    gettextCatalog.getString("Member removed"),
                                    gettextCatalog.getString("The member should now no longer be able to access the project")
                                );
                            },
                            function error (rejection) {
                                console.log(rejection);
                                if (rejection.data && rejection.data.error) {
                                    toaster.pop('error',
                                        gettextCatalog.getString("Error"),
                                        rejection.data.error.join(', ')
                                    );
                                } else {
                                    toaster.pop('error',
                                        gettextCatalog.getString("Error"),
                                        gettextCatalog.getString("Could not remove member from project")
                                    );
                                }
                            }
                        );
                    } else {
                        // only set user to no access
                        assignment.role = vm.defaultRoleNoAccess;
                        assignment.$update().then(
                            function success (response) {
                                toaster.pop('success',
                                    gettextCatalog.getString("Member updated"),
                                    gettextCatalog.getString("The member should now no longer be able to access the project")
                                );
                            },
                            function error (rejection) {
                                console.log(rejection);
                                if (rejection.data && rejection.data.error) {
                                    toaster.pop('error',
                                        gettextCatalog.getString("Error"),
                                        rejection.data.error.join(', ')
                                    );
                                } else {
                                    toaster.pop('error',
                                        gettextCatalog.getString("Error"),
                                        gettextCatalog.getString("Could not remove member from project")
                                    );
                                }
                            }
                        );
                    }
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }
            );
        };
    });
})();
