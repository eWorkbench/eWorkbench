/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing a translation for all fields for each entity from the api
     */
    module.factory('WorkbenchElementsTranslationsService', function (gettextCatalog, workbenchElements) {
        'ngInject';

        /**
         * Maps the Django Content Type (provided by the REST API) to the model name
         */
        var contentTypeToModelName = {};

        /**
         * List of models that are relatable
         * @type {Array}
         */
        var relatableModels = [];

        /**
         * List of models that are searchable
         * @type {Array}
         */
        var searchableModels = [];

        /**
         * Maps the model names to django content types
         * @type {{}}
         */
        var modelNameToContentType = {};

        /**
         * Maps the model names to their respective translation
         * @type {{}}
         */
        var modelNameToTranslation = {};

        /**
         * Maps the model names to their respective plural translation
         * @type {{}}
         */
        var modelNameToTranslationPlural = {};

        /**
         * Iterate over workbench elements and fill
         * - contentTypeToModelName
         * - modelNameToContentType
         * - relatableModels
         */
        for (var elementName in workbenchElements.elements) {
            if (workbenchElements.elements.hasOwnProperty(elementName)) {
                var element = workbenchElements.elements[elementName];

                contentTypeToModelName[elementName] = element.modelName;

                modelNameToContentType[element.modelName] = elementName;
                // add plural name as well
                // modelNameToContentType[element.modelName + "s"] = elementName;

                // translation
                modelNameToTranslation[element.modelName] = element.translation;

                // plural translation
                modelNameToTranslationPlural[element.modelName] = element.translationPlural;

                // add to relatableModels
                if (element.relatable) {
                    relatableModels.push(elementName);
                }

                // add to searchableModels
                if (element.searchable) {
                    searchableModels.push(elementName);
                }
            }
        }

        /**
         * Translate one label
         * raises a console warning if workbenchElements does not contain the field name for a given resource
         * @param resource
         * @param field
         * @returns {string}
         */
        var translateFieldName = function (resource, field) {
            // handle some default names
            if (field == 'created_by' || field == 'created_by.username') {
                return gettextCatalog.getString('Created by');
            } else if (field == 'created_at') {
                return gettextCatalog.getString('Created at');
            } else if (field == 'projects') {
                return gettextCatalog.getString("Projects");
            } else if (field == 'project') {
                return gettextCatalog.getString("Project");
            } else if (field == 'deleted') {
                return ""; // no need to return anything for the "deleted" field
            }

            // default value for translatedLabel is the field name
            var translatedLabel = field;

            // get the respective workbenchElements
            var workbenchElement = workbenchElements.elements[modelNameToContentType[resource]];

            // and check if the field label exists
            if (workbenchElement && workbenchElement.labels[field]) {
                translatedLabel = workbenchElement.labels[field];
            } else {
                console.warn(
                    'No translation found for ' + resource + '->' + field + ";" +
                    " consider adding it in workbenchElements.js"
                );
            }

            return translatedLabel;
        };

        return {
            contentTypeToModelName: contentTypeToModelName,
            relatableModels: relatableModels,
            searchableModels: searchableModels,
            modelNameToContentType: modelNameToContentType,
            modelNameToTranslation: modelNameToTranslation,
            modelNameToTranslationPlural: modelNameToTranslationPlural,
            translateFieldName: translateFieldName
        };
    });

})();
