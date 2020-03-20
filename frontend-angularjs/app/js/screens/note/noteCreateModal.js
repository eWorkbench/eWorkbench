/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for creating a note-create modal dialog
     */
    module.service('noteCreateModalService', function (
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
                templateUrl: 'js/screens/note/noteCreateModal.html',
                controller: 'NoteCreateModalController',
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
         * @param note
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (note, options) {
            return $state.go("note-view", {note: note}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param note
         * @returns {string} the url
         */
        service.getViewUrl = function (note) {
            return $state.href("note-view", {note: note});
        };

        return service;
    });

    /**
     * Note Create Controller
     *
     * Displays the note create form
     */
    module.controller('NoteCreateModalController', function (
        $scope,
        $state,
        $uibModalInstance,
        NoteRestService,
        ProjectSidebarService,
        toaster,
        gettextCatalog,
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

        // either copy element from a template or create a new kanban board
        if (template) {
            vm.note = template;
            vm.note.subject = gettextCatalog.getString('Copy of ') + vm.note.subject;
            vm.projectPks = template.projects;
        } else {
            vm.note = {};
        }

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return !PermissionService.has('object.edit', vm.note);
        };

        /**
         * create a new note
         */
        vm.create = function () {
            // set projects (from vm.projectPks)
            vm.note.projects = vm.projectPks;

            vm.errors = {};

            // call REST API
            NoteRestService.create(vm.note).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Comment created"));

                    // done - close the modal dialog
                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to create comment"));
                    console.log(rejection);
                    vm.errors = rejection.data;

                    // handle permission denied errors
                    if (rejection.status == 403) {
                        // permission denied -> this is most likely due to the fact that the user does not have the
                        // appropriate permissions in the selected project
                        if (vm.note.projects && vm.note.projects.length > 0) {
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new comment in at least one of the " +
                                    "specified projects"
                                )
                            ];
                        } else {
                            // permission denied -> user must select a project
                            vm.errors['projects'] = [
                                gettextCatalog.getString(
                                    "You do not have permissions to create a new comment without selecting a project"
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
