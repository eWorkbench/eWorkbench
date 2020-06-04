/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Service for opening the Appointment Export Modal Dialog
     */
    module.service('meetingExportService', function (
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @returns {$uibModalInstance}
         */
        service.open = function (exportUrl) {
            return $uibModal.open({
                templateUrl: 'js/screens/meetingExport/meetingExportModal.html',
                controller: 'MeetingExportModalController',
                controllerAs: 'vm',
                resolve: {
                    exportUrl: function () {
                        return exportUrl;
                    }
                }
            });
        };

        return service;
    });

    module.controller('MeetingExportModalController', function (
        $uibModalInstance,
        exportUrl
    ) {
        "ngInject";
        var
            vm = this;

        vm.exportUrl = exportUrl;

        vm.close = function () {
            $uibModalInstance.close();
        }
    });
})();
