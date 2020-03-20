/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for creating a drive-create modal dialog
     */
    module.service('driveCreateModalService', function (
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
                templateUrl: 'js/screens/drive/driveCreateModal.html',
                controller: 'DriveCreateModalController',
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
         * @param drive
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (drive, options) {
            return $state.go("drive-view", {drive: drive}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param drive
         * @returns {string} the url
         */
        service.getViewUrl = function (drive) {
            return $state.href("drive-view", {drive: drive});
        };

        return service;
    });

    /**
     * Drive Create Controller
     *
     * Displays the drive create form
     */
    module.controller('DriveCreateModalController', function (
        $scope,
        $state,
        $uibModalInstance,
        DriveRestService,
        ProjectSidebarService,
        toaster,
        gettextCatalog,
        IconImagesService,
        template
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

            // either copy element from a template or create a new kanban board
            if (template) {
                vm.drive = template;
                vm.drive.title = gettextCatalog.getString('Copy of ') + vm.drive.title;
                vm.projectPks = template.projects;
            } else {
                vm.drive = {};
            }
        };

        /**
         * create a new drive
         */
        vm.create = function () {
            // set projects (from vm.projectPks)
            vm.drive.projects = vm.projectPks;

            // call REST API
            DriveRestService.create(vm.drive).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Storage created"));

                    // done - close the modal dialog
                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to create Storage"));
                    console.log(rejection);
                    vm.errors = rejection.data;

                    // handle permission denied errors
                    if (rejection.status == 403) {
                        // permission denied -> this is most likely due to the fact that the user does not have the
                        // appropriate permissions in the selected project
                        if (vm.drive.projects && vm.drive.projects.length > 0) {
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new Storage in at least one of the " +
                                    "specified projects"
                                )
                            ];
                        } else {
                            // permission denied -> user must select a project
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new Storage without selecting a project"
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
