/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('app');

    module.factory('$exceptionHandler', function (
        $injector,
        restApiUrl
    ) {
        "ngInject";

        var backendVersion = "";

        var error = function (exception, cause) {

            // preserve the default behaviour which will log the error
            // to the console, and allow the application to continue running.
            var $http = $injector.get('$http');
            var $log = $injector.get('$log');
            var $window = $injector.get('$window');

            $log.error.apply($log, arguments);

            var errorMessage = exception.toString();

            window.StackTrace.fromError(exception).then(function (arrayStack) {
                var exceptionData = angular.toJson({
                    error_url: $window.location.href,
                    backend_version: backendVersion,
                    error_message: errorMessage,
                    stack_trace: arrayStack,
                    cause: ( cause || "" )
                });

                // post exceptionData to the backend
                $http.post(restApiUrl + "js_error_logger/", exceptionData).then();
            }).catch(function (backendLoggingError) {
                $log.warn("Error logging failure.");
                $log.log(backendLoggingError);
            });

        };

        return error;
    });
})();
