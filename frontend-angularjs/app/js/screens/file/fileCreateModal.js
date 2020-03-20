/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for creating a file-create modal dialog
     */
    module.service('fileCreateModalService', function (
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
                templateUrl: 'js/screens/file/fileCreateModal.html',
                controller: 'FileCreateModalController',
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
         * @param file
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (file, options) {
            return $state.go("file-view", {file: file}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param file
         * @returns {string} the url
         */
        service.getViewUrl = function (file) {
            return $state.href("file-view", {file: file});
        };

        return service;
    });

    /**
     * File Create Modal Controller
     *
     * Displays the file create form in a modal dialog
     */
    module.controller('FileCreateModalController', function (
        $scope,
        $state,
        $uibModalInstance,
        FileRestService,
        GlobalErrorHandlerService,
        ProjectSidebarService,
        gettextCatalog,
        IconImagesService,
        toaster,
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

            // either copy element from a template or create a new file
            if (template) {
                vm.file = template;
                vm.file.title = gettextCatalog.getString('Copy of ') + vm.file.title;
                vm.file.name = gettextCatalog.getString('Copy of ') + vm.file.name;
                vm.file.original_filename = vm.file.name;
                // if a user removes a file from a storage it is set null
                // in order to be able to duplicate it we need to set it to an empty string
                if (vm.file.directory_id === null) {
                    vm.file.directory_id = "";
                }
                vm.projectPks = vm.file.projects;
            } else {
                vm.file = {};
            }
        };

        /**
         * create a new file
         */
        vm.create = function () {
            // set projects (from vm.projectPks)
            vm.file.projects = vm.projectPks;

            // set file.name according to file path
            if (vm.file.path.length > 0) {
                vm.file.name = vm.file.path[0].name;
            }

            vm.errors = {};

            // call REST API
            FileRestService.create(vm.file).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("File created"));

                    // done - close the modal dialog
                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    // handle insufficient storage error - occurs when user storage limit was reached
                    if (rejection.status == 507) {
                        var rejectionMessage = GlobalErrorHandlerService.handleRestApiStorageError(rejection);

                        console.log(rejection);

                        toaster.pop('error', rejectionMessage.toasterTitle, rejectionMessage.toasterMessage);
                        vm.errors['path'] = [rejectionMessage.validationMessage];
                    } else {
                        toaster.pop('error', gettextCatalog.getString("Failed to create file"));
                        console.log(rejection);
                        vm.errors = rejection.data;

                        // handle permission denied errors
                        if (rejection.status == 403) {
                            // permission denied -> this is most likely due to the fact that the user does not have the
                            // appropriate permissions in the selected project
                            if (vm.file.projects && vm.file.projects.length > 0) {
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new file in at least one of the " +
                                        "specified projects"
                                    )
                                ];
                            } else {
                                // permission denied -> user must select a project
                                vm.errors['projects'] = [
                                    gettextCatalog.getString(
                                        "You do not have permissions to create a new file without selecting a project"
                                    )
                                ];
                            }
                        }
                    }
                }
            );
        };

        /**
         * Dismiss the modal dialog
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
