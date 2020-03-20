/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Service for creating a resource-create modal dialog
     */
    module.service('resourceCreateModalService', function (
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
                templateUrl: 'js/screens/resource/resourceCreateModal.html',
                controller: 'ResourceCreateModalController',
                controllerAs: 'vm',
                size: 'lg',
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
         * @param resource
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (resource, options) {
            return $state.go("resource-view", {resource: resource}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param resource
         * @returns {string} the url
         */
        service.getViewUrl = function (resource) {
            return $state.href("resource-view", {resource: resource});
        };

        return service;
    });

    module.controller('ResourceCreateModalController', function (
        $scope,
        $state,
        $timeout,
        $uibModalInstance,
        ResourceRestService,
        toaster,
        gettextCatalog,
        IconImagesService,
        PermissionService,
        template,
        ResourceConverterService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {

            vm.errors = {};

            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            vm.resourceTypes = ResourceConverterService.resourceTypeTexts;

            /**
             * Default form options
             */
            vm.resource = {};
            vm.resource.type = vm.getFirstTypeOption();
            vm.resource.user_availability = vm.getFirstUserAvailabilityOption();

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * A list of selected user PKs
             * @type {Array}
             */
            vm.selectedUsersPks = [];

            /**
             * A list of selected usergroup PKs
             * @type {Array}
             */
            vm.selectedUserGroupsPks = [];

            /**
             * when template is not null the data of the template object should
             * be shown in the modal view else the default data
             */
            if (template) {
                vm.resource = template;
                delete vm.resource.terms_of_use_pdf;
                if (template.name) {
                    vm.resource.name = gettextCatalog.getString('Copy of ') + vm.resource.name;
                }
                if (template.user_availability_selected_user_pks) {
                    vm.selectedUsersPks = template.user_availability_selected_user_pks;
                }
                if (template.user_availability_selected_user_group_pks) {
                    vm.selectedUserGroupsPks = template.user_availability_selected_user_group_pks;
                }
                if (template.projects) {
                    vm.projectPks = template.projects;
                }
            }

        };

        /**
         * Returns the first resource type option
         * @type {string}
         */
        vm.getFirstTypeOption = function () {
            for (var resourceType in ResourceConverterService.resourceTypeTexts) {
                if (ResourceConverterService.resourceTypeTexts.hasOwnProperty(resourceType)) {
                    return resourceType;
                }
            }

            return null;
        };

        /**
         * Returns the first resource userAvailability option
         * @type {string}
         */
        vm.getFirstUserAvailabilityOption = function () {
            for (var userAvailability in ResourceConverterService.resourceUserAvailabilityTexts) {
                if (ResourceConverterService.resourceUserAvailabilityTexts.hasOwnProperty(userAvailability)) {
                    return userAvailability;
                }
            }

            return null;
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return !PermissionService.has('object.edit', vm.resource);
        };

        vm.create = function () {
            vm.resource.projects = vm.projectPks;
            vm.resource.user_availability_selected_user_pks = vm.selectedUsersPks;
            vm.resource.user_availability_selected_user_group_pks = vm.selectedUserGroupsPks;
            vm.errors = {};

            // A new resource can only be created if the checkbox for
            // "resource's owner agrees to usage" is checked
            if (vm.resource.owner_agreement !== true) {
                vm.errors['owner_agreement'] = [
                    gettextCatalog.getString(
                        "This field is required"
                    )
                ];
                toaster.pop('error', gettextCatalog.getString("Failed to create resource"));
            } else {
                ResourceRestService.create(vm.resource).$promise.then(
                    function success (response) {
                        toaster.pop('success', gettextCatalog.getString("Resource created"));
                        $uibModalInstance.close(response);
                    },
                    function error (rejection) {
                        toaster.pop('error', gettextCatalog.getString("Failed to create resource"));
                        console.log(rejection);
                        vm.errors = rejection.data;

                        if (rejection.status === 403) {
                            // permission denied -> this is most likely due to the fact that the user does not have the
                            // appropriate permissions in the selected project
                            if (vm.resource.projects && vm.resource.projects.length > 0) {
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new resource in at least one of the " +
                                        "specified projects"
                                    )
                                ];
                            } else {
                                // permission denied -> user must select a project
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new resource without selecting a project"
                                    )
                                ];
                            }
                        }
                    }
                );
            }
        };

        /**
         * Dismiss the modal dialog
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
