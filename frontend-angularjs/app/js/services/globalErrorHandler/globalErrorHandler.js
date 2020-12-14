/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Global Error Handler Service
     */
    module.factory('GlobalErrorHandlerService', function (
        $interpolate,
        gettextCatalog
    ) {
        "ngInject";

        var service = {};

        service.handleRestApiError = function (rejection) {
            if (rejection.sttaus == 507) {
                return self.handleRestApiStorageError(rejection);
            }

            return {
                "toasterTitle": undefined,
                "toasterMessage": undefined,
                "validationMessage": undefined
            };
        };

        service.handleRestApiStorageError = function (rejection) {
            if (rejection.data && rejection.data.available_storage) {
                return {
                    "toasterTitle": gettextCatalog.getString("User storage limit was reached"),
                    "validationMessage":
                        $interpolate(
                            gettextCatalog.getString(
                                "The file is too large. The user storage limit was reached ({{ availableStorage | number:1 }} MB free)."
                            )
                        )(
                            {
                                availableStorage: rejection.data.available_storage
                            }
                        )
                }
            } else if (rejection.data && rejection.data.max_file_size) {
                return {
                    "toasterTitle": gettextCatalog.getString("File too large"),
                    "validationMessage":
                        $interpolate(
                            gettextCatalog.getString(
                                "The file is too large. You can only upload files smaller than {{ maxFileSize }} GB."
                            )
                        )(
                            {
                                maxFileSize: rejection.data.max_file_size
                            }
                        )
                }
            }

            return {};
        };

        service.handleRestApiDSSContainerError = function (rejection) {
            if (rejection.data && rejection.data.detail && rejection.data.value) {
                var validationMessage = '';

                if (rejection.data.value == 'RO') {
                    validationMessage = rejection.data.detail;
                }

                if (rejection.data.value == 'RWNN') {
                    validationMessage = gettextCatalog.getString(
                        "The DSS container does not allow files to be added"
                    )
                }

                if (rejection.data.value == 'RWON') {
                    validationMessage = gettextCatalog.getString(
                        "The DSS container does not allow imported files to be edited"
                    )
                }

                return {
                    "toasterTitle": gettextCatalog.getString("DSS Read Write Error"),
                    "validationMessage": validationMessage
                }
            }

            return {};
        };

        return service;
    });
})();
