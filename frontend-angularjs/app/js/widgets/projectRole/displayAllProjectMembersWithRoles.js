/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('displayAllProjectMembersWithRolesWidget', function () {
        return {
            'restrict': 'E',
            'controller': 'DisplayAllProjectMembersWithRolesWidgetController',
            'templateUrl': 'js/widgets/projectRole/displayAllProjectMembersWithRoles.html',
            'scope': {
                'project': '='
            },
            'bindToController': true,
            'controllerAs': 'vm'
        };
    });

    module.controller('DisplayAllProjectMembersWithRolesWidgetController', function (
        $scope,
        ProjectRoleUserAssignmentRestServiceFactory,
        toaster,
        gettextCatalog
    ) {
        var vm = this;

        this.$onInit = function () {
            vm.dataLoaded = false;

            /**
             * List of all project members
             * @type {Array}
             */
            vm.allProjectMembers = [];

            /**
             * Dictionary of all roles per user primary key
             * @type {{}}
             */
            vm.allProjectMembersRoles = {};

            vm.projectRoleUserAssignmentRestService = ProjectRoleUserAssignmentRestServiceFactory(vm.project.pk);

            getAssignmentsUp();
        };

        var getAssignmentsUp = function () {
            return vm.projectRoleUserAssignmentRestService.resource.getAssignmentsUp().$promise.then(
                function success (response) {
                    vm.allProjectMembers = [];
                    vm.allProjectMembersRoles = {};

                    for (var i = 0; i < response.length; i++) {
                        var assignment = response[i];

                        vm.allProjectMembers.push(assignment.user);

                        if (!vm.allProjectMembersRoles[assignment.user.pk]) {
                            vm.allProjectMembersRoles[assignment.user.pk] = [];
                        }

                        vm.allProjectMembersRoles[assignment.user.pk].push(assignment.role);
                    }
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to query project members"));
                }
            ).finally(function () {
                vm.dataLoaded = true;
            });
        };
    });
})();
