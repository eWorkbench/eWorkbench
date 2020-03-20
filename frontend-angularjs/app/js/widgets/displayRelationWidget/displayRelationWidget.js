/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * A directive which formats all relations object coming from the REST API
     */
    module.directive('displayRelationWidget', function () {
        return {
            templateUrl: 'js/widgets/displayRelationWidget/displayRelationWidget.html',
            controller: 'DisplayRelationWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                project: '=',
                relation: '=',
                newNoteRelation: '=',
                relationContentobject: '=',
                relationModel: '='
            }
        }
    });

    module.controller('DisplayRelationWidgetController', function (
        AuthRestService,
        IconImagesService,
        LockStatusService,
        RelationUpdateDeleteService,
        RelationIconService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * current user pk
             * @type {number}
             */
            vm.auth_user_pk = 0;

            /**
             * saves the status of the 3 icons (lock, unlock, chain)
             * @type {{}}
             */
            vm.displayIcons = {};

            /**
             * used to have the onDelete() and toggleLock() function in the specific relationWidgets
             * (displayRelationFileWidget, displayRelationContactWidget,...)
             * @type {{}}
             */
            vm.api = {};

            /**
             * deletes the current relation
             */
            vm.api.onDelete = function () {
                RelationUpdateDeleteService.delete(vm.relation);
            };

            /**
             * updates the private field of the relation
             */
            vm.api.toggleLock = function () {
                vm.errors = false;
                RelationUpdateDeleteService.update(vm.relation).then(
                    function success (response) {
                    },
                    function error (rejection) {
                        vm.errors = true;
                    }
                );
            };

            /**
             * is true when an error by the api call occurs
             * @type {boolean}
             */
            vm.errors = false;

            vm.lockStatusText = LockStatusService.lockStatusText;

            /**
             * gets the correct icons
             */
            vm.unlockIcon = RelationIconService.status.unlock;
            vm.lockIcon = RelationIconService.status.lock;
            vm.removeIcon = RelationIconService.remove;
            vm.trashIcon = IconImagesService.mainActionIcons.trash;

            AuthRestService.getWaitForLoginPromise().then(function () {
                vm.auth_user_pk = AuthRestService.getCurrentUser().pk;
                vm.setDisplayIconStatus();
            });

            vm.displayIcons = {
                'isAllowedToLock': false,
                'isAllowedToUnlock': false,
                'chain': true
            };
        };

        /**
         * set the display icons to their correct status
         */
        vm.setDisplayIconStatus = function () {
            if (!vm.relationContentobject || vm.relationContentobject.error || vm.newNoteRelation) {
                return;
            }

            /**
             * Users are allowed to lock/unlock a relation/link, if they created it
             */
            if (vm.auth_user_pk == vm.relation.created_by.pk) {
                vm.displayIcons['isAllowedToLock'] = true;
                vm.displayIcons['isAllowedToUnlock'] = true;
                vm.displayIcons['chain'] = true;
            } else {
                vm.displayIcons['isAllowedToLock'] = false;
                vm.displayIcons['isAllowedToUnlock'] = false;
                vm.displayIcons['chain'] = false;
            }
        };


    });
})();
