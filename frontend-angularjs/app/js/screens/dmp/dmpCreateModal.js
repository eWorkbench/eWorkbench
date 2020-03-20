/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for creating a dmp-create modal dialog
     */
    module.service('dmpCreateModalService', function (
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
                templateUrl: 'js/screens/dmp/dmpCreateModal.html',
                controller: 'DmpCreateModalController',
                controllerAs: 'vm',
                backdrop: 'static' // do not close modal by clicking outside
            });
        };

        /**
         * View the supplied element
         * @param dmp
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (dmp, options) {
            return $state.go("dmp-view", {dmp: dmp}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param dmp
         * @returns {string} the url
         */
        service.getViewUrl = function (dmp) {
            return $state.href("dmp-view", {dmp: dmp});
        };

        return service;
    });

    /**
     * DMP Create Controller
     *
     * Displays the DMP Create Form
     */
    module.controller('DmpCreateModalController', function (
        $scope,
        $state,
        $uibModalInstance,
        $q,
        AuthRestService,
        DmpRestService,
        DmpFormsRestService,
        ProjectSidebarService,
        ProjectRestService,
        gettextCatalog,
        toaster
    ) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            /**
             * Initialize the dmp
             * @type {{title: string, project: (*)}}
             */
            vm.dmp = {
                title: '',
                project: null
            };

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * marks that we are in create mode
             * @type {boolean}
             */
            vm.mode = 'create';

            /**
             * A dictionary containing errors
             * @type {{}}
             */
            vm.errors = {};

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
         * Query DMP Templates
         */
        DmpFormsRestService.queryCached().$promise.then(
            function success (response) {
                vm.dmpForms = response;
            },
            function error (rejection) {
                toaster.pop('error', gettextCatalog.getString("Could not load DMP forms"));
            }
        );

        /**
         * create a new DMP via REST API
         */
        vm.create = function () {
            vm.errors = {};

            vm.dmp.projects = vm.projectPks;

            DmpRestService.create(vm.dmp).$promise.then(
                function success (response) {
                    toaster.pop('success',
                        gettextCatalog.getString("DMP created"),
                        gettextCatalog.getString("You created a new dmp with the name ") + vm.dmp.title
                    );

                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    console.log("Failed to create dmp!");
                    console.log(rejection);
                    vm.errors = rejection.data;

                    if (rejection.status == 403) {
                        // permission denied -> this is most likely due to the fact that the user does not have the
                        // appropriate permissions in the selected project
                        if (vm.dmp.projects && vm.dmp.projects.length > 0) {
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new DMP in at least one of the " +
                                    "specified projects"
                                )
                            ];
                        } else {
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new DMP without selecting a project"
                                )
                            ];
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
