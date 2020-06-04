/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Service for creating a contact-create modal dialog
     */
    module.service('contactCreateModalService', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @returns {$uibModalInstance}
         */
        service.open = function (template) {
            return $uibModal.open({
                templateUrl: 'js/screens/contact/contactCreateModal.html',
                controller: 'ContactCreateModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    template: function () {
                        return template;
                    }
                }
            });
        };

        /**
         * View the supplied element
         * @param contact
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (contact, options) {
            return $state.go("contact-view", {contact: contact}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param contact
         * @returns {string} the url
         */
        service.getViewUrl = function (contact) {
            return $state.href("contact-view", {contact: contact});
        };

        return service;
    });

    /**
     * Contact Create Controller
     *
     * Displays the Contact Create Form
     */
    module.controller('ContactCreateModalController', function (
        $scope,
        $filter,
        $state,
        $uibModalInstance,
        toaster,
        gettextCatalog,
        ContactRestService,
        ProjectSidebarService,
        IconImagesService,
        PermissionService,
        template
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * Dictionary of errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * gets the correct icons
             */
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * marks that we are in create mode
             * @type {boolean}
             */
            vm.mode = 'create';

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * Keeps track of whether a user has or had been selected yet.
             * @type {boolean}
             */
            vm.userProfileHasBeenSelected = false;

            /**
             * Add current project
             */
            if (ProjectSidebarService.project) {
                vm.projectPks.push(ProjectSidebarService.project.pk);
            }

            // either copy element from a template or create a new contact
            if (template) {
                vm.contact = angular.copy(template);
                vm.projectPks = vm.contact.projects;
            } else {
                vm.contact = {};
            }
        };

        /**
         * watch for changes in user select input
         * and fill in contact data
         */
        $scope.$watch("vm.userPK", function () {
            if (vm.userPK) {
                var user = $filter('filter')(vm.users, {'pk': vm.userPK})[0];

                // copy user data to avoid changing data via bindings
                // (changes in vm.contact would otherwise change the data displayed in the user selection field)
                var userCopy = angular.copy(user),
                    profile = angular.copy(userCopy.userprofile);

                vm.contact = profile;
                vm.contact.academic_title = profile.academic_title;
                vm.contact.first_name = profile.first_name;
                vm.contact.last_name = profile.last_name;
                vm.contact.phone = profile.phone;
                vm.contact.email = userCopy.email;
                vm.contact.notes = '';
                if (profile.email_others && profile.email_others.length > 0) {
                    vm.contact.notes += '<ul>';
                    for (var m = 0; m < profile.email_others; m++) {
                        vm.contact.notes += '<li>' + profile.email_others + '</li>';
                    }
                    vm.contact.notes += '</ul>';
                }
                if (profile.org_zug_mitarbeiter_lang) {
                    vm.contact.company = profile.org_zug_mitarbeiter_lang.join(', ');
                }
                vm.contact.metadata = [];

                vm.userProfileHasBeenSelected = true;

            } else if (vm.userProfileHasBeenSelected) {
                // overwrite contact only if a user profile had been selected before
                // so initial templates (duplicate function) are not overwritten
                vm.contact = {};
            }
        });

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return !PermissionService.has('object.edit', vm.contact);
        };

        /**
         * create new contact
         */
        vm.create = function () {
            // set projects (from vm.projectPks)
            vm.contact.projects = vm.projectPks;

            // call REST API
            ContactRestService.create(vm.contact).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Contact created"));

                    // done - close the modal dialog
                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to create contact"));
                    console.log(rejection);
                    vm.errors = rejection.data;

                    // handle permission denied errors
                    if (rejection.status == 403) {
                        // permission denied -> this is most likely due to the fact that the user does not have the
                        // appropriate permissions in the selected project
                        if (vm.contact.projects && vm.contact.projects.length > 0) {
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new contact in at least one of the " +
                                    "specified projects"
                                )
                            ];
                        } else {
                            // permission denied -> user must select a project
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new contact without selecting a project"
                                )
                            ];
                        }
                    }
                }
            )
        };

        /**
         * Dismiss the modal dialog
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
