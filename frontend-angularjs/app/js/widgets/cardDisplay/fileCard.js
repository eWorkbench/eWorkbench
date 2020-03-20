/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Angular Directive that displays a file as a card
     */
    module.directive('fileCardDisplay', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/cardDisplay/fileCard.html',
            scope: {
                'file': '='
            },
            transclude: {
                'cardFunctions': '?cardFunctions',
                'cardFooter': '?cardFooter'
            },
            controller: 'FileCardDisplayController',
            controllerAs: 'vm',
            bindToController: true
        }
    });

    /**
     * Controller for Contact Card Display
     */
    module.controller('FileCardDisplayController', function (
        $scope,
        IconImagesService,
        toaster,
        gettextCatalog,
        FileIconService,
        FileSaver,
        FileDownloadRestService
    ) {
        var vm = this;

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
         * Watch filename and choose icon
         */
        $scope.$watch("vm.file.original_filename", function () {
            if (vm.file.name) {
                vm.fileIcon = FileIconService.getFileTypeIcon(vm.file.name);
            } else {
                vm.fileIcon = IconImagesService.mainElementIcons.file;
            }
        });

        /**
         * download the displayed file using FileDownloadRestService and FileSaver
         */
        vm.download = function () {
            FileDownloadRestService.download(vm.file.download).then(
                function success (response) {
                    // get mime-type
                    var mimeType = response.headers('content-type');
                    //get the file name from the http content-disposition header
                    var contentDisposition = response.headers('content-disposition');

                    vm.filename = contentDisposition.split("\"")[1];
                    //download file
                    var data = new Blob([response.data], {type: mimeType + 'charset=utf-8'});

                    FileSaver.saveAs(data, vm.filename);
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Failed to download file"));
                }
            );
        };

    });
})();
