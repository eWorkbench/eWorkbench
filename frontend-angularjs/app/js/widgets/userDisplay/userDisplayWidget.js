/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name userDisplayWidget
     *
     * @memberOf module:widgets
     *
     * @restrict E
     *
     * @description
     * Directive user-display-widget takes a user OR a user-pk and renders the provided user with a fa-user icon, the
     * users name (usually first name + last name), and provides a modal-popup on ng-click with more details.
     * If a user object is provided, the user object is rendered. If instead only user-pk is provided, we try to
     * query the ``userCacheService`` for the provided user primary key.
     *
     * @param {object} user the user object (optional)
     * @param {number} userPk the users primary key (optional)
     * @param {boolean} displayAsPlainText whether the user is rendered with icons and a link, or as a plain text
     */
    module.directive('userDisplayWidget', function () {
        return {
            templateUrl: 'js/widgets/userDisplay/userDisplayWidget.html',
            controller: 'UserDisplayWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'E',
            scope: {
                user: '=?',
                userPk: '=?',
                displayAsPlainText: '=?'
            }
        }
    });

    /**
     * Controller for directive userDisplayWidget
     */
    module.controller('UserDisplayWidgetController', function (
        $scope,
        $uibModal,
        IconImagesService,
        userCacheService,
        UserNameService
    ) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            /**
             * gets the correct user icons
             */
            vm.userIcon = IconImagesService.mainElementIcons.user;
            /**
             * gets the correct alert icon
             */
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * Whether this user has been found
             * @type {boolean}
             */
            vm.notFound = false;

            /**
             * The user display string
             * @type {string}
             */
            vm.displayUserString = "";

            /**
             * Whether or not the user is active and has logged in at least once
             * @type {boolean}
             */
            vm.userIsActive = false;
        };

        $scope.$watch("vm.user", function () {
            if (!vm.user && vm.userPk) {
                vm.user = userCacheService.getUserFromCache(vm.userPk);
                if (!vm.user) {
                    vm.notFound = true;
                }
            }

            if (!vm.notFound && vm.user) {
                vm.displayUserString = UserNameService.getFullNameOrUsername(vm.user);
                vm.userIsActive = vm.user.is_active && vm.user.last_login;
            } else {
                vm.userIsActive = false;
            }
        });

        /**
         * On Click of a user, open a modal dialog with details
         */
        vm.onItemClick = function () {
            var modalInstance = $uibModal.open({
                templateUrl: 'js/widgets/userDisplayDetailWidget/userDisplayDetailWidget.html',
                controller: 'userDisplayDetailWidgetController',
                controllerAs: 'vm',
                resolve: {
                    user: function () {
                        return vm.user;
                    }
                }
            });

            modalInstance.result.then(
                function () {
                    console.log('modal dialog closed');
                }
            );
        }
    });
})();
