/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Shows the overall project data.
     */
    module.component('overviewProject', {
        templateUrl: 'js/screens/project/overviewProject.html',
        controller: 'OverviewProjectController',
        controllerAs: 'vm',
        bindings: {
            'project': '='
        }
    });

    /**
     * Controller for project overview screen component.
     */
    module.controller('OverviewProjectController', function (
        $scope,
        $filter,
        $q,
        $timeout,
        $uibModal,
        AuthRestService,
        CalendarConfigurationService,
        IconImagesService,
        ProjectRoleUserAssignmentRestServiceFactory,
        ProjectRestService,
        ProjectStateService,
        RolesRestService,
        toaster,
        gettextCatalog
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * An array with roles (coming from REST API)
             * @type {Array}
             */
            vm.roles = [];

            /**
             * The currently logged in user
             * @type {undefined}
             */
            vm.currentUser = AuthRestService.getCurrentUser();

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

            /**
             * DatePicker Options
             * @type {
             *  {format: string,
             *   widgetPositioning: {horizontal: string, vertical: string},
             *    allowInputToggle: boolean, showTodayButton: boolean}
             *   }
             */
            vm.datePickerOptions = CalendarConfigurationService.getOptions({
                format: CalendarConfigurationService.dateFormats.shortFormat,
                widgetPositioning: {horizontal: 'right', vertical: 'bottom'},
                allowInputToggle: true,
                showTodayButton: true
            });

            // copy date picker options for start date and stop date
            vm.datePickerOptionsStartDate = angular.copy(vm.datePickerOptions);
            vm.datePickerOptionsStopDate = angular.copy(vm.datePickerOptions);

            /**
             * Whether members of parent projects should be shown (default false)
             * @type {boolean}
             */
            vm.showMembersOfParentProjects = false;

            /**
             * Whether members of sub projects should be shown (default false)
             * @type {boolean}
             */
            vm.showMembersOfSubProjects = false;

            /**
             * List of project role user assignments
             * @type {Array}
             */
            vm.projectRoleUserAssignment = [];

            vm.projectRoleUserAssignmentRestService = ProjectRoleUserAssignmentRestServiceFactory(vm.project.pk);

            /**
             * Available project states
             * @type {*}
             */
            vm.projectStates = ProjectStateService.texts;

            /**
             * Project icon
             */
            vm.projectIcon = IconImagesService.mainElementIcons.project;

            /**
             * Whether project member detail view mode is active
             * @type {boolean}
             */
            vm.projectMemberDetailView = false;

            $q.when()
                .then(checkProjectPermissionsOfCurrentUser)
                .then(getRoles)
                .then(getProjectRoleUserAssignments)
                .then(getAllParentProjects);
        };

        /**
         * On any change of start_date, adapt stop_date
         * This is accomplished by calculating the time difference in minutes from the original start_date and the new
         * start_date, and adding exactly that value to stop_date
         */
        $scope.$watch('vm.project.start_date', function (newVal, oldVal) {
            // due_date needs to have a min_date of the current date
            vm.datePickerOptionsStopDate.minDate = vm.project.start_date;
        }, true);

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
         *
         */
        vm.toggleProjectMembersEditMode = function () {
            if (!vm.isReadOnly()) {
                vm.projectMemberDetailView = !vm.projectMemberDetailView;
            }
        };

        /**
         * Open a modal dialog with the current users permissions for the currently viewed project
         */
        vm.showCurrentUsersProjectPermissions = function () {
            $uibModal.open({
                'templateUrl': 'js/screens/project/projectUserPermissions.html',
                'controller': function ($scope, $uibModalInstance, permissions) {
                    "ngInject";

                    $scope.permissions = permissions;

                    $scope.dismiss = function () {
                        $uibModalInstance.dismiss();
                    }
                },
                resolve: {
                    'permissions': function () {
                        return vm.project.current_users_project_permissions_list;
                    }
                }
            });
        };

        /**
         * Gets the project role user assignment for the current project
         */
        var getProjectRoleUserAssignments = function () {
            vm.projectRoleUserAssignmentRestService.queryCached().$promise.then(
                function success (response) {
                    vm.projectRoleUserAssignment = response;
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Could not load project role user assignments"));
                }
            );
        };

        /**
         * Determines whether the base model can be edited or not.
         * @returns {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly;
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

        /**
         * reset errors
         */
        vm.resetErrors = function () {
            vm.errors = {};
        };

        /**
         * Update a Project via REST API
         */
        vm.saveProject = function () {
            vm.readOnly = true;
            // emits the read only state so it can be accessed in app/js/screens/project/projectView.js
            $scope.$emit("project-isReadOnly");
            // reset errors
            vm.errors = {};

            // to clear values, we need to set them to null
            if (vm.project.start_date == false) {
                vm.project.start_date = null;
            }

            if (vm.project.end_date == false) {
                vm.project.end_date = null;
            }

            if (vm.project.parent_project == undefined) {
                vm.project.parent_project = null;
            }

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            vm.project.$update().then(
                function success (response) {
                    vm.project = response;

                    d.resolve();
                },
                function error (rejection) {
                    console.log(rejection);

                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data) {
                        // Validation error - an error message is provided by the api
                        d.reject(rejection.data);
                        vm.errors = rejection.data;
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update Project"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
                // emits the read only state so it can be accessed in app/js/screens/project/projectView.js
                $scope.$emit("project-isNotReadOnly");
            });

            return d.promise;
        };

        /**
         * Filter only projects that are in projectsDict and that are not marked as deleted
         * @param project
         * @returns {boolean}
         */
        vm.onlyAvailableProjects = function (project) {
            var projectInDict = vm.projectsDict[project.pk];

            return projectInDict && !projectInDict.deleted;
        };

        /**
         * Partial (PATCH) Update of a project via REST API
         * @param key
         * @param value
         */
        vm.saveProjectPartial = function (key, value) {
            vm.readOnly = true;
            // emits the read only state so it can be accessed in app/js/screens/project/projectView.js
            $scope.$emit("project-isReadOnly");
            var data = {
                'pk': vm.project.pk
            };

            if ((key == 'start_date' || key == 'stop_date') && value == false) {
                value = null;
            }

            // modifying the parent project to undefined means setting it to null
            if (key == 'parent_project' && value == undefined) {
                value = null;
            }

            data[key] = value;

            // reset errors
            vm.errors = {};

            // we need to use $q to tell x-editable that an error happened
            var d = $q.defer();

            // do a partial update via rest api
            ProjectRestService.updatePartial(data).$promise.then(
                function success (response) {
                    vm.project = response;
                    // worked
                    d.resolve();
                },
                function error (rejection) {
                    console.log(rejection);

                    /**
                     * Handle errors (Validation error, Permission error, unknown error)
                     */
                    if (rejection && rejection.data && rejection.data[key]) {
                        // Validation error - an error message is provided by the api
                        d.reject(rejection.data[key].join(", "));
                        vm.errors = rejection.data;
                    } else if (rejection.data.non_field_errors) {
                        // non_field_error occured (e.g., object has already been trashed/soft-deleted) and can
                        // therefore no longer be edited
                        d.reject(rejection.data.non_field_errors);
                        vm.errors[key] = rejection.data.non_field_errors;
                    } else if (rejection.status == 403) {
                        // Permission denied -> write our own error message
                        d.reject(gettextCatalog.getString("Permission denied"));
                        vm.errors[key] = [rejection.data.detail];
                    } else {
                        // Unknown error -> write our own error message
                        toaster.pop('error', gettextCatalog.getString("Failed to update project"));
                        d.reject(gettextCatalog.getString("Unknown error"));
                        vm.errors[key] = [gettextCatalog.getString("Unknown error")];
                    }
                }
            ).finally(function () {
                vm.readOnly = false;
                // emits the read only state so it can be accessed in app/js/screens/project/projectView.js
                $scope.$emit("project-isNotReadOnly");
            });

            return d.promise;
        };

        var getAllParentProjects = function () {
            var filters = {
                'parents_of': vm.project.pk
            };

            vm.projectRoleUserAssignmentForParent = {};
            vm.parentProjects = [];

            ProjectRestService.queryCached(filters).$promise.then(function (response) {
                vm.projectsDict = {};

                for (var i = 0; i < response.length; i++) {
                    var prj = response[i];

                    vm.projectsDict[prj.pk] = prj;
                }

                // get parent of current project
                var parent = vm.projectsDict[vm.project.parent_project];

                while (parent !== undefined) {
                    vm.parentProjects.unshift(parent.pk);
                    parent = vm.projectsDict[parent.parent_project];
                }
            });
        };
    });
})();
