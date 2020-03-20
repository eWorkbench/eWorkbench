/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Service for creating a note list modal dialog
     */
    module.factory('noteListModalService', function (
        $uibModal
    ) {
        var service = {};

        service.open = function (workbenchElement) {
            return $uibModal.open({
                templateUrl: 'js/widgets/noteListModal/noteListModal.html',
                controller: 'NoteListModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    'workbenchElement': function () {
                        return workbenchElement;
                    }
                }
            });
        };

        return service;
    });

    /**
     * Controller for the Note List Modal
     */
    module.controller('NoteListModalController', function (
        $scope,
        $q,
        $uibModalInstance,
        AuthRestService,
        NoteRestService,
        RelationsRestServiceFactory,
        WorkbenchElementsTranslationsService,
        toaster,
        gettextCatalog,
        workbenchElement
    ) {
        var vm = this;

        this.$onInit = function () {
            /**
             * The workbench element that the notes are displayed for
             * @type {workbenchElement|*}
             */
            vm.workbenchElement = workbenchElement;

            /**
             * Name of the workbench element model
             */
            vm.workbenchElementModelName = WorkbenchElementsTranslationsService
                .contentTypeToModelName[workbenchElement.content_type_model];

            /**
             * Relations Service for the provided workbench element
             */
            vm.relationsService = RelationsRestServiceFactory(
                vm.workbenchElementModelName,
                workbenchElement.pk
            );

            /**
             * List of relations for the workbench element
             * @type {Array}
             */
            vm.relations = [];

            /**
             * List of notes for the workbench element
             * @type {Array}
             */
            vm.notes = [];

            /**
             * The new note that needs to be created
             * @type {{}}
             */
            vm.note = {};

            vm.note.projects = vm.workbenchElement.projects;

            /**
             * Whether or not the new note is currently being submitted
             * @type {boolean}
             */
            vm.isSubmitting = false;

            AuthRestService.getWaitForLoginPromise().then(
                function () {
                    vm.currentUser = AuthRestService.getCurrentUser();

                    if (vm.currentUser && vm.currentUser.permissions) {
                        vm.canCreateNote = vm.currentUser.permissions.indexOf('shared_elements.add_note_without_project') >= 0;
                    } else {
                        vm.canCreateNote = false;
                    }
                }
            );

            vm.getRelations();
        };

        /**
         * Get all relations for the provided workbench element
         */
        vm.getRelations = function () {
            return vm.relationsService.queryCached().$promise.then(
                function success (response) {
                    vm.relations = response;
                    vm.relationLoaded = true;

                    // iterate over relations and count notes
                    vm.notes = [];

                    for (var i = 0; i < response.length; i++) {
                        var relation = response[i];

                        // verify that left object is a note, and is not the current object
                        if (relation.left_object_id != vm.workbenchElement.child_object_id) {
                            var leftModelName =
                                WorkbenchElementsTranslationsService
                                    .contentTypeToModelName[relation.left_content_type_model];

                            // if this is a node, add it to vm.notes
                            if (leftModelName == 'note') {
                                vm.notes.push(relation.left_content_object);
                            }
                        } else if (relation.right_object_id != vm.workbenchElement.child_object_id) {
                            var rightModelName =
                                WorkbenchElementsTranslationsService
                                    .contentTypeToModelName[relation.right_content_type_model];

                            // if this is a node, add it to vm.notes
                            if (rightModelName == 'note') {
                                vm.notes.push(relation.right_content_object);
                            }
                        }
                    }
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to load links"));
                    console.log(rejection);
                }
            );
        };

        /**
         * Creates a new note and a new relation
         */
        vm.createNewNote = function () {
            vm.isSubmitting = true;

            $q.when()
                .then(vm.restCreateNote)
                .then(vm.restCreateRelation)
                .then(resetNote)
                .then(vm.getRelations);
        };

        var resetNote = function () {
            vm.note = {};
            vm.note.projects = vm.workbenchElement.projects;
            vm.private = false;
            vm.isSubmitting = false;
        };

        vm.restCreateNote = function () {
            return NoteRestService.create(vm.note).$promise.then(
                function success (response) {
                    vm.note = response;

                    return vm.note;
                },
                function error (rejection) {
                    vm.isSubmitting = false;

                    if (rejection.status == 403) {
                        toaster.pop('error', gettextCatalog.getString("Permission denied"));
                    } else {
                        toaster.pop('error',
                            gettextCatalog.getString("Error"),
                            gettextCatalog.getString("Failed to create note")
                        );
                    }

                    return false;
                }
            );
        };

        vm.restCreateRelation = function () {
            vm.relationObject = {
                right_content_type: vm.workbenchElement.content_type,
                right_object_id: vm.workbenchElement.pk,
                left_content_type: vm.note.content_type,
                left_object_id: vm.note.pk,
                private: vm.private
            };

            return vm.relationsService.create(vm.relationObject).$promise.then(
                function success (response) {
                    // done - broadcast relations changed
                    $scope.$emit('relations-changed');

                    return response;
                },
                function error (rejection) {
                    vm.isSubmitting = false;

                    if (rejection.status == 403) {
                        toaster.pop('error', gettextCatalog.getString("Permission denied"));
                    } else {
                        toaster.pop('error',
                            gettextCatalog.getString("Error"),
                            gettextCatalog.getString("Failed to create relation")
                        );
                    }
                }
            );
        };

        /**
         * Close the modal
         */
        vm.close = function () {
            $uibModalInstance.close();
        };
    });
})();
