/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    module.component('userManualStaff', {
        templateUrl: 'js/screens/userManual/userManualStaff.html',
        controller: 'UserManualStaffController',
        controllerAs: 'vm'
    });

    module.controller('UserManualStaffController', function (
        $scope,
        $q,
        $state,
        FileSaver,
        UserManualCategoryRestService,
        UserManualExporter,
        gettextCatalog,
        selectFileWithPicker,
        toaster
    ) {
        "ngInject";

        var vm = this;

        /**
         * Export the current user manual as a zip file (using downloader)
         */
        vm.exportUserManual = function () {
            UserManualExporter.export().then(
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

        /**
         * Import a zip file for the user manual
         */
        vm.importUserManual = function () {
            selectFileWithPicker('application/zip').then(
                function success (files) {
                    var file = files[0];

                    // 1. create a new note via REST API
                    UserManualExporter.import(file).then(
                        function success (response) {
                            toaster.pop('success', gettextCatalog.getString("Imported"));
                            // clear user manual cache (done via $state "usermanual")
                            $state.go('usermanual');
                        },
                        function error (rejection) {
                            console.log(rejection);
                            toaster.pop('error', gettextCatalog.getString("Import failed"));
                        }
                    );
                }
            );
        };
    })
})();
