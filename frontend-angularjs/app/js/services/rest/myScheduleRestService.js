/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/my/schedule using ngResource
     */
    module.factory('MyScheduleRestService', function (
        cachedResource,
        restApiUrl,
        TaskConverterService,
        MeetingConverterService,
        ResourceBookingConverterService
    ) {
        'ngInject';

        /**
         * Transforms the schedule response to either an appointment or a task response
         * @param data
         * @param headersGetter
         * @returns {*|any|Object|Array|string|number}
         */
        var transformScheduleResponse = function (data, headersGetter) {
            var list = angular.fromJson(data);

            for (var i = 0; i < list.length; i++) {
                var entry = list[i];

                if (entry.content_type_model === "shared_elements.meeting") {
                    entry = MeetingConverterService.convertMeetingFromRestAPI(entry);
                } else if (entry.content_type_model === "shared_elements.task") {
                    entry = TaskConverterService.convertTaskFromRestAPI(entry);
                } else if (entry.content_type_model === "projects.resourcebooking") {
                    entry = ResourceBookingConverterService.convertResourceBookingFromRestAPI(entry);
                } else {
                    console.error("/api/my/schedule: Got entry with invalid content type " + entry.content_type_model);
                }
            }

            return list;
        };

        // create ng-resource for api endpoint /api/my/schedule
        return cachedResource(
            restApiUrl + 'my/schedule/',
            {pk: '@pk'},
            {
                'query': {
                    'method': 'GET',
                    'isArray': true,
                    'transformResponse': transformScheduleResponse
                },
                'getExportLink': {
                    'url': restApiUrl + 'my/schedule/get_export_link/',
                    'method': 'PATCH',
                    'isArray': false
                }
            },
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 5, // seconds
                invalidateCacheOnUpdates: false,
                relatedCaches: []
            }
        );
    });

    /**
     * Define API Endpoint for /api/my/schedule/get_export_link/
     */
    module.factory('MyScheduleRestServiceExport', function (
        $resource,
        $uibModal,
        $window,
        gettextCatalog,
        restApiUrl,
        toaster,
        meetingExportService
    ) {
        'ngInject';

        var service = {};

        var resource = $resource(restApiUrl + 'my/schedule/get_export_link/', {}, {
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
         * Calls getExportUrl and then opens the URL in a popup window
         */
        service.doExport = function (filters) {
            return service.getExportUrl(filters).$promise.then(
                function success (response) {
                    /**
                     * Open a modal dialog to copy the url
                     */
                    var modalInstance = meetingExportService.open(response.url);

                    // react on the result of the modal dialog
                    modalInstance.result.then(
                        function closed () {

                        },
                        function dismissed () {

                        }
                    );
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
