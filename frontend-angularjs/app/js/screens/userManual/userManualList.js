/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Compontent for showing a list of user manual categories
     */
    module.component('userManualList', {
        templateUrl: 'js/screens/userManual/userManualList.html',
        controller: 'UserManualListController',
        controllerAs: 'vm'
    });

    module.controller('UserManualListController', function (
        $scope,
        UserManualCategoryRestService,
        $state
    ) {
        "ngInject";

        /**
         * Query the user manual categories
         */
        UserManualCategoryRestService.query().$promise.then(
            function success (response) {
                // redirect to the first category
                $state.go('usermanual/category', {userManualCategory: response[0]});
            },
            function error (rejection) {
                console.log(rejection);
            }
        );
    });
})();
