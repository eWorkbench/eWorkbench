/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Service for creating a modal dialog that displays the privileges of a workbench element
     */
    module.factory('objectPrivilegesModalService', function (
        $uibModal
    ) {
        var service = {};

        /**
         * Open a modal dialog for a workbench element
         * @param baseUrlModel the plural name of the model of the workbench element (e.g., tasks)
         * @param baseModel the workbench element
         */
        service.open = function (baseUrlModel, baseModel) {
            return $uibModal.open({
                templateUrl: 'js/screens/objectPrivileges/objectPrivilegesModalView.html',
                controller: 'ObjectPrivilegesModalViewController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    baseUrlModel: function () {
                        return baseUrlModel;
                    },
                    baseModel: function () {
                        return baseModel;
                    }
                }
            });
        };

        return service;
    });

    /**
     * Service for showing a notice that the object privilege still exists
     */
    module.factory('objectPrivilegeStillFoundModalService', function (
        $uibModal
    ) {
        var service = {};

        service.open = function (user) {
            return $uibModal.open({
                templateUrl: 'js/screens/objectPrivileges/objectPrivilegeStillFoundModal.html',
                controller: function ($scope, $uibModalInstance, user) {
                    "ngInject";

                    var vm = this;

                    vm.user = user;

                    vm.dismiss = function () {
                        $uibModalInstance.dismiss();
                    };
                },
                controllerAs: 'vm',
                bindToController: true,
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    user: function () {
                        return user;
                    }
                }
            });
        };

        return service;
    });

    /**
     * Controller for Displaying the Object Privileges as a Modal View
     *
     * Renders all privileges of a given object, and allows to edit those privileges (only if the current user has the
     * full access privilege)
     */
    module.controller('ObjectPrivilegesModalViewController', function (
        $scope,
        $uibModalInstance,
        AuthRestService,
        IconImagesService,
        ObjectPrivilegesRestServiceFactory,
        gettextCatalog,
        toaster,
        objectPrivilegesReallyDeleteModalService,
        objectPrivilegeStillFoundModalService,
        // Variables injected from modal
        baseUrlModel,
        baseModel
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * Primary Key of the new user
             * @type {null}
             */
            vm.newUserPk = null;

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * REST API for Object Privileges
             */
            vm.objectPrivilegesRestService = ObjectPrivilegesRestServiceFactory(baseUrlModel, baseModel.pk);

            /**
             * A list of privileges (can be edited)
             * @type {Array}
             */
            vm.privileges = [];

            /**
             * Whether the current user can edit privileges or not
             * @type {boolean}
             */
            vm.canEditPrivileges = false;

            /**
             * Icons for main actions
             * @type {*}
             */
            vm.icons = IconImagesService.mainActionIcons;

            /**
             * The object that we show the object privileges
             * @type {baseModel|*}
             */
            vm.obj = baseModel;

            /**
             * Watch newUserPk from the selectize plugin
             * If it changes, add the selected user to the privileges via REST API
             * This way new users can be added
             */
            $scope.$watch("vm.newUserPk", function (newVal, oldVal) {
                if (oldVal == null && newVal != oldVal) {
                    // try to create a new model privilege
                    vm.objectPrivilegesRestService.create({
                        'user_pk': newVal,
                        'view_privilege': 'AL'
                    }).$promise.then(vm.getObjectPrivileges);

                    vm.newUserPk = null;
                }
            });
            vm.getObjectPrivileges();
        };

        /**
         * Queries the REST API for all object privileges for the given model and primary key
         */
        vm.getObjectPrivileges = function () {
            return vm.objectPrivilegesRestService.query().$promise.then(
                function success (response) {
                    // reset whether the current user can edit privileges
                    vm.canEditPrivileges = false;

                    if (response.length == 0) {
                        toaster.pop('error', gettextCatalog.getString("Failed to query privileges"));
                        console.log("No privileges returned");
                        $uibModalInstance.dismiss();
                    } else {
                        // iterate over those privileges and verify the current user has full access
                        for (var i = 0; i < response.length; i++) {
                            var priv = response[i];

                            if (priv.user.pk == vm.currentUser.pk && priv.full_access_privilege == 'AL') {
                                vm.canEditPrivileges = true;
                                break;
                            }
                        }
                    }

                    vm.privileges = response;
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to query privileges"));
                    console.log(rejection);
                    $uibModalInstance.dismiss();
                }
            )
        };

        /**
         * Updates the given privilege via REST API
         * @param privilege
         */
        vm.updatePrivilege = function (privilege) {
            privilege.$update().then(
                function success (response) {
                    // it's possible that the primary key of the object has changed,
                    // we need to take that into account
                    privilege.pk = response.pk
                },
                function error (rejection) {
                    console.log(rejection);
                    // reset privilege
                    privilege.$get();

                    toaster.pop('error', gettextCatalog.getString("Failed to update privilege"));
                }
            );
        };

        /**
         * Sets all privileges to denied
         * @param privilege
         */
        vm.denyAccess = function (privilege) {
            // set full access to neutral
            privilege.full_access_privilege = 'NE';
            // set all other privileges to denied
            privilege.view_privilege = 'DE';
            privilege.edit_privilege = 'DE';
            privilege.restore_privilege = 'DE';
            privilege.trash_privilege = 'DE';
            privilege.delete_privilege = 'DE';

            privilege.$update().then(
                function success (response) {
                    // don't know what can happen here... refresh all privileges
                    vm.getObjectPrivileges();
                },
                function error (rejection) {
                    console.log(rejection);
                    // reset privilege
                    privilege.$get();

                    toaster.pop('error', gettextCatalog.getString("Failed to update privilege"));
                }
            );
        };

        /**
         * Resets a privilege via REST API
         * This means that the privileges are all set to NEUTRAL,
         * meaning that they can be overwritten by project roles
         * or "inherited" privileges (such as Task Assignees)
         * @param privilege
         */
        vm.resetAccess = function (privilege) {
            // set everything to neutral
            privilege.full_access_privilege = 'NE';
            privilege.view_privilege = 'NE';
            privilege.edit_privilege = 'NE';
            privilege.restore_privilege = 'NE';
            privilege.trash_privilege = 'NE';
            privilege.delete_privilege = 'NE';

            privilege.$update().then(
                function success (response) {
                    // don't know what can happen here... refresh all privileges
                    vm.getObjectPrivileges().then(
                        function done () {
                            // check if the privilege has re-appeared with allowed access
                            for (var i = 0; i < vm.privileges.length; i++) {
                                if (vm.privileges[i].user_pk == privilege.user_pk) {
                                    privilege = vm.privileges[i];

                                    // found! check if anything of this privilege is still set to allowed
                                    if (privilege.full_access_privilege == 'AL' || privilege.view_privilege == 'AL' ||
                                        privilege.edit_privilege == 'AL' || privilege.restore_privilege == 'AL' ||
                                        privilege.trash_privilege == 'AL' || privilege.delete_privilege == 'AL') {
                                        /**
                                         * This user seems to have an inherited privilege -> reset was successful
                                         * This means we can delete the privilege safely
                                         */
                                        privilege.$delete().then(
                                            function success (response) {
                                                // on delete we need to refresh the data
                                                vm.getObjectPrivileges();
                                            }
                                        );

                                        /**
                                         * We should also notify the user that the privilege has been successfuly
                                         * restored
                                         */
                                        toaster.pop(
                                            'success', gettextCatalog.getString("Restored"),
                                            gettextCatalog.getString("Privileges of the user have been restored")
                                        );

                                    } else {
                                        /**
                                         * the privilege has been set to neutral,
                                         * the user does not seem to have access
                                         * to the element anymore
                                         */
                                        toaster.pop(
                                            'success', gettextCatalog.getString("Restored"),
                                            gettextCatalog.getString("User can no longer access this element")
                                        )
                                    }

                                    break;
                                }
                            }
                        }
                    );
                },
                function error (rejection) {
                    console.log(rejection);
                    // reset privilege
                    privilege.$get();

                    toaster.pop('error', gettextCatalog.getString("Failed to update privilege"));
                }
            );
        };

        var denyAccess = function (priv) {
            // set all privileges to denied
            priv.full_access_privilege = 'DE';
            priv.view_privilege = 'DE';
            priv.edit_privilege = 'DE';
            priv.restore_privilege = 'DE';
            priv.trash_privilege = 'DE';
            priv.delete_privilege = 'DE';

            return priv.$update().$promise;
        };

        /**
         * Deletes a privilege via REST API
         * Needs to refresh the whole list
         * @param privilege
         */
        vm.deletePrivilege = function (privilege) {
            objectPrivilegesReallyDeleteModalService.open(privilege).result.then(
                function confirm () {
                    privilege.$delete().then(
                        function success (response) {
                            // on delete we need to refresh the data
                            vm.getObjectPrivileges().then(
                                function done () {
                                    // check if there is another privilege for this user
                                    for (var i = 0; i < vm.privileges.length; i++) {
                                        if (vm.privileges[i].user_pk == privilege.user_pk) {
                                            /**
                                             * There is still a privilege, although we deleted it!
                                             * This is most likely because there is a parent-privilege (e.g.,
                                             * project-role or an inherited privilege such as task assignee)
                                             *
                                             * Deny Access for this user, and notify the user
                                             * in a modal dialog about it
                                             */
                                            // reset to deny
                                            denyAccess(vm.privileges[i]);

                                            objectPrivilegeStillFoundModalService.open(vm.privileges[i].user);

                                            break;
                                        }
                                    }
                                }
                            );
                        },
                        function error (rejection) {
                            console.log(rejection);
                            // reset privilege
                            privilege.$get();

                            toaster.pop('error', gettextCatalog.getString("Failed to delete privilege"));
                        }
                    )
                },
                function dismiss () {
                    console.log("Delete dismissed");
                }
            );
        };

        /**
         * Checks whether a privilege can be reset
         * This is only true if the privilege has a primary key and the privileges are not all set to neutral
         * @param priv
         * @returns {boolean}
         */
        vm.canResetAccess = function (priv) {
            // can not reset privilege if they are set to neutral already
            if (priv.full_access_privilege == 'NE' &&
                priv.view_privilege == 'NE' &&
                priv.edit_privilege == 'NE' &&
                priv.restore_privilege == 'NE' &&
                priv.delete_privilege == 'NE') {
                return false;
            }

            // privilege can only be reset if its an actual privilege with a primary key, not an inherited privilege
            return priv.pk !== undefined && priv.pk != '';
        };

        /**
         * Access to a privilege an only be denied if at least one privilege is set to allowed
         * @param priv
         */
        vm.canDenyAccess = function (priv) {
            return priv.full_access_privilege == 'AL' ||
                priv.view_privilege == 'AL' ||
                priv.edit_privilege == 'AL' ||
                priv.restore_privilege == 'AL' ||
                priv.delete_privilege == 'AL';
        };

        /**
         * Allow only privileges that have at least one privilege set to allow
         * @param priv
         * @returns {boolean}
         */
        vm.filterPrivileges = function (priv) {
            return priv.full_access_privilege == 'AL' ||
                priv.view_privilege == 'AL' ||
                priv.edit_privilege == 'AL' ||
                priv.restore_privilege == 'AL' ||
                priv.delete_privilege == 'AL';
        };

        /**
         * close the modal dialog
         */
        vm.close = function (result) {
            $uibModalInstance.close(result);
        };

        /**
         * dismiss the modal dialog
         */
        vm.dismiss = function (reason) {
            $uibModalInstance.dismiss(reason);
        };
    });
})();
