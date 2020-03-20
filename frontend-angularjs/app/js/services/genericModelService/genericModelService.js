/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Gets the modal service for generic elements.
     */
    module.factory('GenericModelService', function (
        $injector,
        WorkbenchElementsTranslationsService
    ) {
        'ngInject';

        var service = {};

        service.getCreateModalServiceByModelName = function (modelName) {
            var lowerCasedModelName = modelName.toLowerCase();

            return $injector.get(lowerCasedModelName + "CreateModalService");
        };

        /**
         * Gets the CreateModalService for the type of the given model.
         */
        service.getCreateModalService = function (model) {
            var contentType = model ? model.content_type_model : null;

            if (!contentType) {
                console.error("No content type set on model.", model);

                return null;
            }

            var modelName = WorkbenchElementsTranslationsService.contentTypeToModelName[contentType];

            if (!modelName) {
                console.error("Unknown content type", contentType);

                return null;
            }

            return service.getCreateModalServiceByModelName(modelName);
        };

        /**
         * Gets the RestService for the type of the given model.
         */
        service.getRestServiceByModelName = function (modelName) {
            var lowerCasedModelName = modelName.toLowerCase();
            var firstLetterUppercasedModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

            // check if screenNewEntityType is available in WorkbenchElementsTranslationsService
            if (!WorkbenchElementsTranslationsService.modelNameToContentType[lowerCasedModelName]) {
                console.error("Unknown model name", lowerCasedModelName);

                return null;
            }

            return $injector.get(firstLetterUppercasedModelName + "RestService");
        };

        return service;
    });

})();
