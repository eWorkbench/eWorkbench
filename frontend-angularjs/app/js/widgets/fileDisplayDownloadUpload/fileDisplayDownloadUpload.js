/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Widget that displays a download link for a file
     * Also provides drag and drop (actually, only drop) functionality for dropping a file that is then automatically
     * uploaded
     */
    module.directive('fileDisplayDownloadUploadWidget', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/fileDisplayDownloadUpload/fileDisplayDownloadUpload.html',
            scope: {
                'file': '='
            },
            controller: 'FileDisplayDownloadUploadWidgetController',
            controllerAs: 'vm',
            bindToController: true
        };
    });

    /**
     * Controller for fileDisplayDownloadUploadWidget
     *
     * Handles drag and drop events and displays the file download link
     */
    module.controller('FileDisplayDownloadUploadWidgetController', function (
        $scope,
        IconImagesService,
        toaster,
        gettextCatalog,
        FileDownloadRestService,
        FileIconService,
        FileRestService,
        FileSaver
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
        $scope.$watch("vm.file.name", function () {
            if (vm.file.name) {
                vm.fileIcon = FileIconService.getFileTypeIcon(vm.file.name);
            } else {
                vm.fileIcon = IconImagesService.mainElementIcons.file;
            }
        });

        vm.upload = function (files) {
            console.log("Uploading...");

            FileRestService.updatePartial({
                'pk': vm.file.pk,
                'path': files[0]
            }).$promise.then(
                function success (response) {
                    vm.file = response;
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Upload failed"));
                }
            );
        };

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
