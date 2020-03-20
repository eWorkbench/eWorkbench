/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A simple directive that makes the function buttons for relations (unlink, private) "dryer"
     */
    module.directive('displayRelationFunctionsWidgetTable', function () {
        return {
            restrict: 'E',
            controller: 'DisplayRelationFunctionsWidgetTableController',
            templateUrl: 'js/widgets/displayRelationWidget/displayRelationFunctionsTable.html',
            bindToController: true,
            controllerAs: 'vm',
            scope: {
                relation: '='
            }
        }
    });

    module.controller("DisplayRelationFunctionsWidgetTableController", function (
        $scope,
        AuthRestService,
        IconImagesService,
        LockStatusService,
        RelationIconService,
        RelationUpdateDeleteService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {

            vm.relationContentObject = vm.relation["left_content_object"];

            /**
             * current user pk
             * @type {number}
             */
            vm.authUserPk = 0;

            /**
             * File Icon
             * @type {string}
             */
            vm.fileIcon = IconImagesService.mainElementIcons.file;

            /**
             * Project Icon
             * @type {string}
             */
            vm.projectIcon = IconImagesService.mainElementIcons.project;

            /**
             * saves the status of the 3 icons (lock, unlock, chain)
             * @type {{}}
             */
            vm.displayIcons = {};

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
                vm.authUserPk = AuthRestService.getCurrentUser().pk;
                vm.setDisplayIconStatus();
            });

            vm.displayIcons = {
                'isAllowedToLock': false,
                'isAllowedToUnlock': false,
                'chain': true
            };
        };

        vm.toggleLock = function () {
            vm.errors = false;
            RelationUpdateDeleteService.update(vm.relation).then(
                function success (response) {
                },
                function error (rejection) {
                    vm.errors = true;
                }
            );
        };

        vm.onDelete = function () {
            RelationUpdateDeleteService.delete(vm.relation);
        };

        /**
         * set the display icons to their correct status
         */
        vm.setDisplayIconStatus = function () {
            if (!vm.relationContentObject || vm.relationContentObject.error) {
                return;
            }

            /**
             * Users are allowed to lock/unlock a relation/link, if they created it
             */
            if (vm.authUserPk == vm.relation.created_by.pk) {
                vm.displayIcons['isAllowedToLock'] = true;
                vm.displayIcons['isAllowedToUnlock'] = true;
                vm.displayIcons['chain'] = true;
            } else {
                vm.displayIcons['isAllowedToLock'] = false;
                vm.displayIcons['isAllowedToUnlock'] = false;
                vm.displayIcons['chain'] = false;
            }
        };
    })
})();
