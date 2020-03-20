/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Metadata part for small*View
     */
    module.directive('smallEntityViewMetadata', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/metadata/smallEntityViewMetadata/smallEntityViewMetadata.html',
            controller: 'SmallEntityViewMetadataController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                metadata: '=',
                readOnly: '<',
                baseModel: '<',
                baseUrlModel: '<'
            }
        }
    });

    module.controller('SmallEntityViewMetadataController', function (
        $scope,
        gettextCatalog,
        AuthRestService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.currentUser = AuthRestService.getCurrentUser();

            var isVersionView = vm.metadata,
                userHasViewMetadataPermission = vm.currentUser.permissions.indexOf('metadata.view_metadata') >= 0;

            vm.isVisible = isVersionView && userHasViewMetadataPermission;
        };
    });
})();
