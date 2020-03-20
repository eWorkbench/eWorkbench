/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    module.directive('noteCreateCardWidget', function () {
        return {
            'restrict': 'E',
            'templateUrl': 'js/widgets/cardDisplay/noteCreateCard.html',
            'controller': 'NoteCreateCardWidgetController',
            'controllerAs': 'vm',
            'bindToController': true,
            'scope': {
                'relationModel': '<',
                'relationContentobject': '<'
            }
        }
    });

    module.controller('NoteCreateCardWidgetController', function (
        $scope,
        $rootScope,
        $q,
        AuthRestService,
        IconImagesService,
        NoteRestService,
        RelationsRestServiceFactory,
        gettextCatalog,
        toaster,
        WorkbenchElementsTranslationsService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            /**
             * The note that is to be created
             * @type {{}}
             */
            vm.note = {};
            vm.noteIcon = IconImagesService.mainElementIcons.note;
            vm.currentUser = null;

            /**
             * Whether the current user can create notes or not
             */
            vm.canCreateNote = false;

            /**
             * Whether or not the relation that is created here is private
             */
            vm.private = false;

            /**
             * Whether or not this view is currently submitting data
             * @type {boolean}
             */
            vm.isSubmitting = false;

            vm.relationsService = RelationsRestServiceFactory(vm.relationModel, vm.relationContentobject.pk);

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
        };

        /**
         * Creates a new note and a new relation
         */
        vm.createNewNote = function () {
            vm.isSubmitting = true;

            $q.when().then(
                vm.restCreateNote
            ).then(
                vm.restCreateRelation
            ).then(
                resetNote
            );
        };

        var resetNote = function () {
            vm.note = {};
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
                right_content_type: vm.relationContentobject.content_type,
                right_object_id: vm.relationContentobject.pk,
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
    });
})();
