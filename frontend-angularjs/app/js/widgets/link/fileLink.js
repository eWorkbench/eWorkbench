/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('widgets');

    /**
     * A directive which formats a userDisplay object coming from the REST API
     */
    module.directive('fileLink', function () {
        return {
            templateUrl: 'js/widgets/link/fileLink.html',
            controller: "FileLinkController",
            controllerAs: 'vm',
            bindToController: true,
            transclude: true,
            scope: {
                file: '='
            }
        }
    });

    module.controller('FileLinkController', function (
        $scope,
        $state,
        FileIconService
    ) {
        "ngInject";

        var vm = this;

        /**
         * Watch File and generate an URL for the given file
         */
        $scope.$watch("vm.file", function () {
            if (vm.file) {
                vm.fileUrl = $state.href("file-view", {file: vm.file});
                vm.fileIcon = FileIconService.getFileTypeIcon(vm.file.original_filename);
            } else {
                vm.fileUrl = "";
                vm.fileIcon = "";
            }
        });
    });
})();
