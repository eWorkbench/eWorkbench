/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('services');

    /**
     * Provides information for relateable (linkable) models
     */
    module.factory('RelateableModelService', function (
        WorkbenchElementsTranslationsService,
        IconImagesService
    ) {
        'ngInject';

        var service = {};

        service.relateableModels = WorkbenchElementsTranslationsService.relatableModels;

        service.getRelateableModelsWithIcons = function () {
            var models = [];

            for (var i = 0; i < service.relateableModels.length; i++) {
                var contentType = service.relateableModels[i],
                    modelName = WorkbenchElementsTranslationsService.contentTypeToModelName[contentType];

                models.push({
                    'key': contentType,
                    'modelName': modelName,
                    'title': WorkbenchElementsTranslationsService.modelNameToTranslation[modelName],
                    'icon': IconImagesService.mainElementIcons[modelName]
                });
            }

            return models;
        };

        service.relatedModelsWithIcons = service.getRelateableModelsWithIcons();

        return service;
    });

})();
