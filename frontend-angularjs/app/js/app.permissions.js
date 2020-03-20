/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('app');

    /**
     * Define Permissions based on object privileges
     */
    module.run(function (
        PermissionService,
        ObjectPrivilegesRestServiceFactory
    ) {
        var privileges = {};

        /**
         * Simple cache (dictionary) for privileges
         * @type {{}}
         */
        var privilegeRestServices = {};

        var checkIfPrivilegeExistsForObject = function (obj) {
            if (obj && obj.url) {
                if (privileges[obj.url]) {
                    return privileges[obj.url];
                }
            } else {
                console.log("Unknown object");
            }

            return null;
        };

        /**
         * Helper Method for fetching privileges of the current user for the provided object via the REST API
         * @param obj
         */
        var fetchPrivilegesFromApi = function (obj) {
            // privileges are cached, only fetch them once
            if (!privilegeRestServices[obj.url]) {
                // create the privileges rest service
                privilegeRestServices[obj.url] = ObjectPrivilegesRestServiceFactory(obj.url);

                // and fetch privileges for the current user
                privilegeRestServices[obj.url].getPrivilegesForCurrentUser().then(
                    function success (privilege) {
                        // done, store the privileges
                        privileges[obj.url] = privilege;
                    }
                );
            }
        };

        /**
         * Define the object.edit privilege
         */
        PermissionService.define('object.edit', [
            function (obj) {
                if (!obj) {
                    return false;
                }

                if (obj.deleted) {
                    // soft deleted objects can not be edited
                    return false;
                }

                if (!obj.pk) {
                    // objects that have not been created yet can be edited
                    return true;
                }

                var privilege = checkIfPrivilegeExistsForObject(obj);

                if (!privilege) {
                    // fetch privilege (will take some time)
                    fetchPrivilegesFromApi(obj);

                    // return false for now, until we know more (next digest cycle)
                    return false;
                }

                // get privileges of the current user for the given
                return privilege.full_access_privilege == 'AL' || privilege.edit_privilege == 'AL';
            }
        ]);

        /**
         * Define the object.trash privilege
         */
        PermissionService.define('object.trash', [
            function (obj) {
                if (!obj) {
                    return false;
                }

                // if this is a project, we can check the current users project permission list
                if (obj.content_type_model == "projects.project") {
                    return obj.current_users_project_permissions_list.indexOf("projects.trash_project") >= 0;
                }

                var privilege = checkIfPrivilegeExistsForObject(obj);

                if (!privilege) {
                    // fetch privilege (will take some time)
                    fetchPrivilegesFromApi(obj);

                    // return false for now, until we know more (next digest cycle)
                    return false;
                }

                // get privileges of the current user for the given
                return privilege.full_access_privilege == 'AL' || privilege.trash_privilege == 'AL';
            }
        ]);

        /**
         * Defines the object.delete privilege
         */
        PermissionService.define('object.delete', [
            function (obj) {
                if (!obj) {
                    return false;
                }

                // if this is a project, we can check the current users project permission list
                if (obj.content_type_model == "projects.project") {
                    return obj.current_users_project_permissions_list.indexOf("projects.delete_project") >= 0;
                }

                var privilege = checkIfPrivilegeExistsForObject(obj);

                if (!privilege) {
                    // fetch privilege (will take some time)
                    fetchPrivilegesFromApi(obj);

                    // return false for now, until we know more (next digest cycle)
                    return false;
                }

                // get privileges of the current user for the given
                return privilege.full_access_privilege == 'AL' || privilege.delete_privilege == 'AL';
            }
        ]);

        PermissionService.define('object.restore', [
            function (obj) {
                if (!obj) {
                    return false;
                }

                // if this is a project, we can check the current users project permission list
                if (obj.content_type_model == "projects.project") {
                    return obj.current_users_project_permissions_list.indexOf("projects.restore_project") >= 0;
                }

                var privilege = checkIfPrivilegeExistsForObject(obj);

                if (!privilege) {
                    // fetch privilege (will take some time)
                    fetchPrivilegesFromApi(obj);

                    // return false for now, until we know more (next digest cycle)
                    return false;
                }

                // get privileges of the current user for the given
                return privilege.full_access_privilege == 'AL' || privilege.restore_privilege == 'AL';
            }
        ]);
    });
})();
