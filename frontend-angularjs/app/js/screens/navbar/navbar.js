/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    module.component('navbar',
        {
            templateUrl: 'js/screens/navbar/navbar.html',
            controller: 'NavbarController',
            controllerAs: 'vm',
            bindings: {}
        }
    );

    module.controller('NavbarController', function (
        $rootScope,
        $scope,
        $state,
        $transitions,
        $window,
        $cookies,
        $timeout,
        BackendVersionService,
        AuthRestService,
        ProjectSidebarService,
        toaster,
        djangoAdminUrl,
        restApiUrl,
        gettextCatalog,
        IconImagesService,
        SitePreferences,
        contactFormWidget,
        responsiveBreakpoints,
        UserNameService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            /**
             * Whether this is a small screen (< 768 pixels width) or not
             * @type {boolean}
             */
            vm.isSmallScreen = false;

            /**
             * Current selected project (if set)
             * @type {null}
             */
            vm.project = null;

            /**
             * subscribe to the currently selected project
             * @type {unsubscribe|*|void|Promise<PushSubscription>}
             */
            vm.projectSidebarServiceUnsubscribeFunction = ProjectSidebarService.subscribe(function (project) {
                vm.project = project;
            });

            /**
             * The current active page for highlighting
             * @type {string}
             */
            vm.currentActivePage = "";

            vm.currentUser = null;
            vm.sitePreferences = SitePreferences.preferences;
            vm.main_site_name = vm.sitePreferences.site_name;
            vm.Auth = AuthRestService;
            vm.restApiUrl = restApiUrl;
            vm.djangoAdminUrl = djangoAdminUrl;
            vm.userIcon = IconImagesService.mainElementIcons.user;

            BackendVersionService.getBackendVersion().then(function (version) {
                vm.backendVersion = version;
            });
        };

        AuthRestService.getWaitForLoginPromise().then(
            function loggedIn () {
                vm.currentUser = AuthRestService.getCurrentUser();
                vm.userDisplayName = UserNameService.getFullNameMailOrUsername(vm.currentUser);
                if (vm.currentUser && vm.currentUser.permissions) {
                    vm.isDSSCurator = vm.currentUser.permissions.indexOf('dss.add_dsscontainer') >= 0;
                } else {
                    vm.isDSSCurator = false;
                }
            }
        );

        /**
         * Perform a logout and provide feedback to the user
         */
        vm.logout = function () {
            $state.go('main');
            AuthRestService.logout().then(
                function (response) {
                    vm.removeCookies();
                    console.log('Logged out');
                    toaster.pop('success', gettextCatalog.getString("Logged out"));
                    // reload the entire page to clear javascript caches
                    $window.location.reload();
                },
                function (rejection) {
                    console.log('Failed to log out');
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to log out"));
                }
            );
        };

        vm.removeCookies = function () {
            var cookies = $cookies.getAll();

            angular.forEach(cookies, function (v, k) {
                $cookies.remove(k);
            });
        };

        /**
         * Open the contact form in a modal dialog
         */
        vm.openContactForm = function () {
            contactFormWidget.open().result.then(
                function success () {
                    // nothing to do
                },
                function reject () {
                    console.log('Contact modal canceled by user');
                }
            );
        };

        /**
         * On any transition, update currentActivePage so we can highlight the active page in the navbar menu
         */
        $transitions.onSuccess({}, function (trans) {
            var menuItem = trans.$to().activeMenuItem;

            if (menuItem) {
                vm.currentActivePage = menuItem;
            } else {
                vm.currentActivePage = "";
            }
        });

        $scope.$watch(function () {
            return responsiveBreakpoints['xs'] || responsiveBreakpoints['sm']
        }, function (newVal, oldVal) {
            vm.isSmallScreen = newVal;
        });

        /**
         * On destroy, unsubscribe from the project sidebar service
         */
        $scope.$on("$destroy", function () {
            vm.projectSidebarServiceUnsubscribeFunction();
        });

        /**
         * changes the name of the site
         */
        $rootScope.$on("change-navbar", function (event, opt) {
            vm.study_room_mode = opt.study_room_mode;
        });
    });
})();
