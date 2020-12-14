/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Service for creating a dsscontainer-create modal dialog
     */
    module.service('dsscontainerCreateModalService', function (
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
                templateUrl: 'js/screens/dsscontainer/dsscontainerCreateModal.html',
                controller: 'DSSContainerCreateModalController',
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
         * @param dsscontainer
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (dsscontainer, options) {
            return $state.go("dsscontainer-view", {dsscontainer: dsscontainer}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param dsscontainer
         * @returns {string} the url
         */
        service.getViewUrl = function (dsscontainer) {
            return $state.href("dsscontainer-view", {dsscontainer: dsscontainer});
        };

        return service;
    });

    /**
     * DSSContainer Create Controller
     *
     * Displays the DSSContainer Create Form
     */
    module.controller('DSSContainerCreateModalController', function (
        $scope,
        $state,
        $timeout,
        $uibModalInstance,
        DSSContainerRestService,
        DSSContainerConverterService,
        toaster,
        gettextCatalog,
        ProjectSidebarService,
        IconImagesService,
        PermissionService,
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
             * DSSContainer Type Service
             */
            vm.dsscontainerConverterService = DSSContainerConverterService;

            /**
             * gets the correct alert icon
             */
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * A list of project PKs for this element
             * @type {Array}
             */
            vm.projectPks = [];

            /**
             * when template is not null the data of the template object should
             * be shown in the modal view else the default data
             */
            if (template) {
                vm.dsscontainer = template;
                if (template.name) {
                    vm.dsscontainer.name = gettextCatalog.getString('Copy of ') + vm.dsscontainer.name;
                }
                if (template.projects) {
                    vm.projectPks = template.projects;
                }
            } else {
                vm.dsscontainer = {
                    import_option: DSSContainerConverterService.dssContainerImportOptionOrder[0],
                    read_write_setting: 'RO'
                };

                /**
                 * Add current project
                 */
                if (ProjectSidebarService.project) {
                    vm.projectPks.push(ProjectSidebarService.project.pk);
                }
            }
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return !PermissionService.has('object.edit', vm.dsscontainer);
        };

        /**
         * On create
         * Calls REST API to create a new dsscontainer and redirects to dsscontainer/view on success
         */
        vm.create = function () {
            // assign projects
            vm.dsscontainer.projects = vm.projectPks;

            vm.errors = {};

            // call REST API
            DSSContainerRestService.create(vm.dsscontainer).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("DSSContainer created"));

                    // done - close the modal dialog
                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to create dsscontainer"));
                    console.log(rejection);
                    vm.errors = rejection.data;

                    // handle permission denied errors
                    if (rejection.status == 403) {
                        // permission denied -> this is most likely due to the fact that the user does not have the
                        // appropriate permissions in the selected project
                        if (vm.dsscontainer.projects && vm.dsscontainer.projects.length > 0) {
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new dsscontainer in at least one of the " +
                                    "specified projects"
                                )
                            ];
                        } else {
                            // permission denied -> user must select a project
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new dsscontainer without selecting a project"
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
