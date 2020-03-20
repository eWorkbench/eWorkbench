/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Component for viewing a category of the user manual
     */
    module.component('userManualCategoryView', {
        templateUrl: 'js/screens/userManual/userManualCategoryView.html',
        controller: 'UserManualCategoryViewController',
        controllerAs: 'vm',
        bindings: {
            'userManualCategory': '='
        }
    });


    /**
     * Controller for viewing a category of the user manual
     */
    module.controller('UserManualCategoryViewController', function (
        $scope,
        $rootScope,
        $timeout,
        UserManualCategoryHelpTextRestServiceFactory,
        gettextCatalog,
        toaster
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.helpTexts = [];
            vm.isLoadingHelpTexts = true;

            // when entering this page, we need to expand the user manual sidebar menu
            $rootScope.projectSidebarExpanded = 'usermanual-expanded';

            // when leaving this page, we need to hide it
            $scope.$on("$destroy", function () {
                if ($rootScope.projectSidebarExpanded == 'usermanual-expanded') {
                    $rootScope.projectSidebarExpanded = '';
                }
            });

            /**
             * Service for retrieving help texts for the given category
             */
            var userManualCategoryHelpTextRestService = UserManualCategoryHelpTextRestServiceFactory(
                vm.userManualCategory.pk
            );

            // query user manual category help texts
            userManualCategoryHelpTextRestService.query().$promise.then(
                function success (response) {
                    vm.helpTexts = response;
                    vm.isLoadingHelpTexts = false;

                    // bind click handlers after the help texts have rendered
                    $timeout(function () {
                        jQuery('user-manual-category-view img').click(function () {
                            var url = jQuery(this).attr("src");

                            window.open(url, '_blank');
                        });
                    });
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to load category"));
                    vm.isLoadingHelpTexts = false;
                }
            );
        };

        // unbind click handlers when this controller is destroyed
        $scope.$on("$destroy", function () {
            jQuery('user-manual-category-view img').unbind('click');
        });

    });
})();
