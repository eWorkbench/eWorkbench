/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * @ngdoc service
     *
     * @name NotificationRestService
     *
     * @description
     * Define API Endpoint for /api/notifications using ngResource
     */
    module.factory('NotificationRestService', function (
        $injector,
        $resource,
        IconImagesService,
        WorkbenchElementsTranslationsService,
        restApiUrl,
        GenericModelService
    ) {
        "ngInject";

        var getItemTypeName = function (notification) {
            var
                contentType = notification ? notification.content_type_model : null;

            if (contentType) {
                // get modelName
                var modelName = WorkbenchElementsTranslationsService.contentTypeToModelName[contentType];

                return WorkbenchElementsTranslationsService.modelNameToTranslation[modelName];
            }

            return "";
        };

        var getItemIcon = function (notification) {
            var
                contentType = notification ? notification.content_type_model : null;

            if (contentType) {
                // get modelName
                var modelName = WorkbenchElementsTranslationsService.contentTypeToModelName[contentType];

                return IconImagesService.mainElementIcons[modelName];
            }

            return "";
        };

        var getItemUrl = function (notification) {
            var modalService = GenericModelService.getCreateModalService(notification);

            if (modalService) {
                return modalService.getViewUrl({pk: notification.object_id});
            }

            return "";
        };


        var transformNotification = function (notification) {
            // store item url
            notification.url = getItemUrl(notification);

            // store item icon
            notification.icon = getItemIcon(notification);

            // store type name
            notification.typeName = getItemTypeName(notification);
        };

        var transformNotificationStr = function (str) {
            var notification = angular.fromJson(str);

            transformNotification(notification);

            return notification;
        };

        var transformNotificationsStr = function (str) {
            return transformNotificationsStrPaged(str).results;
        };

        var transformNotificationsStrPaged = function (str) {
            var notifications = angular.fromJson(str);

            for (var i = 0; i < notifications.results.length; i++) {
                transformNotification(notifications.results[i]);
            }

            return notifications;
        };

        // create ng-resource for api endpoint /api/notification_configuration
        return $resource(
            restApiUrl + 'notifications/:pk/',
            {pk: '@pk'},
            {
                markAllAsRead: {
                    method: 'POST',
                    isArray: false,
                    url: restApiUrl + 'notifications/read_all/'
                },
                get: {
                    method: 'GET',
                    isArray: false,
                    ignoreLoadingBar: true,
                    transformResponse: transformNotificationStr
                },
                query: {
                    method: 'GET',
                    isArray: true,
                    ignoreLoadingBar: true,
                    transformResponse: transformNotificationsStr
                },
                queryPaged: {
                    method: 'GET',
                    ignoreLoadingBar: true,
                    transformResponse: transformNotificationsStrPaged
                },
                userHasReadNotification: {
                    url: restApiUrl + 'notifications/:pk/read/',
                    method: 'PUT',
                    isArray: false,
                    transformResponse: transformNotificationStr
                }
            }
        );
    });


    /**
     * Define API Endpoint for /api/notification_configuration using ngResource
     */
    module.factory('NotificationConfigurationRestService', function ($resource, restApiUrl) {
        'ngInject';

        // create ng-resource for api endpoint /api/notification_configuration
        return $resource(
            restApiUrl + 'notification_configuration/',
            {},
            {}
        );
    });
})();
