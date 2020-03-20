/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for creating a kanbanboard-create modal dialog
     */
    module.service('kanbanboardCreateModalService', function (
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
                templateUrl: 'js/screens/kanbanboard/kanbanboardCreateModal.html',
                controller: 'KanbanboardCreateModalController',
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
         * @param kanbanboard
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (kanbanboard, options) {
            return $state.go("kanbanboard-view", {kanbanboard: kanbanboard}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param kanbanboard
         * @returns {string} the url
         */
        service.getViewUrl = function (kanbanboard) {
            return $state.href("kanbanboard-view", {kanbanboard: kanbanboard});
        };

        return service;
    });

    /**
     * Kanbanboard Create Controller
     *
     * Displays the Kanbanboard Create Form
     */
    module.controller('KanbanboardCreateModalController', function (
        $scope,
        $state,
        $uibModalInstance,
        toaster,
        gettextCatalog,
        KanbanboardRestService,
        ProjectSidebarService,
        IconImagesService,
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
             * Add current project
             */
            if (ProjectSidebarService.project) {
                vm.projectPks.push(ProjectSidebarService.project.pk);
            }

            // either copy element from a template or create a new kanban board
            if (template) {
                // this will also copy the existing kanban board columns
                vm.kanbanboard = template;
                vm.kanbanboard.title = gettextCatalog.getString('Copy of ') + vm.kanbanboard.title;
                vm.projectPks = vm.kanbanboard.projects;
            } else {
                vm.kanbanboard = {};
            }
        };

        /**
         * create new kanbanboard
         */
        vm.create = function () {
            // set projects (from vm.projectPks)
            vm.kanbanboard.projects = vm.projectPks;

            // call REST API
            KanbanboardRestService.create(vm.kanbanboard).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Kanbanboard created"));

                    // done - close the modal dialog
                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to create kanbanboard"));
                    console.log(rejection);
                    vm.errors = rejection.data;

                    // handle permission denied errors
                    if (rejection.status == 403) {
                        // permission denied -> this is most likely due to the fact that the user does not have the
                        // appropriate permissions in the selected project
                        if (vm.kanbanboard.projects && vm.kanbanboard.projects.length > 0) {
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new kanbanboard in at least one of the " +
                                    "specified projects"
                                )
                            ];
                        } else {
                            // permission denied -> user must select a project
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new kanbanboard without selecting a project"
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
