/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for creating a labbook-create modal dialog
     */
    module.service('labbookCreateModalService', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @returns {$uibModalInstance}
         */
        service.open = function () {
            return $uibModal.open({
                templateUrl: 'js/screens/labbook/labbookCreateModal.html',
                controller: 'LabbookCreateModalController',
                controllerAs: 'vm',
                backdrop: 'static' // do not close modal by clicking outside
            });
        };

        /**
         * View the supplied element
         * @param labbook
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (labbook, options) {
            return $state.go("labbook-view", {labbook: labbook}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param labbook
         * @returns {string} the url
         */
        service.getViewUrl = function (labbook) {
            return $state.href("labbook-view", {labbook: labbook});
        };

        return service;
    });

    /**
     * Labbook Create Controller
     *
     * Displays the labbook create form
     */
    module.controller('LabbookCreateModalController', function (
        $scope,
        $state,
        $uibModalInstance,
        LabbookRestService,
        ProjectSidebarService,
        toaster,
        gettextCatalog,
        IconImagesService,
        PermissionService
    ) {
        'ngInject';

        var
            vm = this;

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
             * Add current project
             */
            if (ProjectSidebarService.project) {
                vm.projectPks.push(ProjectSidebarService.project.pk);
            }
        };

        /**
         * initialize labbook
         */
        vm.labbook = {};

        /**
         * Determines whether the base model can be edited or not.
         * @returns {boolean}
         */
        vm.isReadOnly = function () {
            return !PermissionService.has('object.edit', vm.labbook);
        };

        /**
         * create a new labbook
         */
        vm.create = function () {
            // set projects (from vm.projectPks)
            vm.labbook.projects = vm.projectPks;

            vm.errors = {};

            // call REST API
            LabbookRestService.create(vm.labbook).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("LabBook created"));

                    // done - close the modal dialog
                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to create LabBook"));
                    console.log(rejection);
                    vm.errors = rejection.data;

                    // handle permission denied errors
                    if (rejection.status == 403) {
                        // permission denied -> this is most likely due to the fact that the user does not have the
                        // appropriate permissions in the selected project
                        if (vm.labbook.projects && vm.labbook.projects.length > 0) {
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new LabBook in at least one of the " +
                                    "specified projects"
                                )
                            ];
                        } else {
                            // permission denied -> user must select a project
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new LabBook without selecting a project"
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
