/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * A Service that allows exporting workbench elements
     */
    module.factory('ExportDataService', function (
        $resource,
        $uibModal,
        $window,
        gettextCatalog,
        restApiUrl,
        toaster
    ) {
        'ngInject';

        var service = {};

        var resource = $resource(restApiUrl + ':model/:pk/get_export_link/', {pk: '@pk', model: '@model'}, {
            getExportUrl: {
                method: 'GET',
                isArray: false
            }
        });

        /**
         * REST API Call for getting the export url
         * @type {*|getExportUrl|{method, isArray}}
         */
        service.getExportUrl = resource.getExportUrl;

        /**
         * Calls getExportUrl and then openes the URL in a new window
         * if opening in a new window does not work (e.g., popup blocker detected), we show an error message to the user
         * @param data
         */
        service.doExport = function (data) {
            return service.getExportUrl(data).$promise.then(
                function success (response) {
                    if (!$window.open(response.url, '_blank')) {
                        // open a modal dialog with more info
                        $uibModal.open({
                            templateUrl: 'js/services/export/popupBlocker.html',
                            resolve: {
                                'downloadUrl': function () {
                                    return response.url;
                                }
                            },
                            controller: function ($scope, $uibModalInstance, downloadUrl) {
                                $scope.downloadUrl = downloadUrl;

                                $scope.close = function () {
                                    $uibModalInstance.close();
                                };
                            }
                        });
                    }
                },
                function error (rejection) {
                    console.log(rejection);
                    if (rejection.data && rejection.data.non_field_errors) {
                        toaster.pop('error', gettextCatalog.getString("Export failed"),
                            rejection.data.non_field_errors.join(" ")
                        );
                    } else {
                        toaster.pop('error', gettextCatalog.getString("Export failed"));
                    }
                }
            )
        };

        return service;
    });
})();
