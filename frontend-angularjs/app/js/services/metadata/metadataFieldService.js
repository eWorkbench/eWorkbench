/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Provides up-to-date metadata field information.
     */
    module.service('MetadataFieldService', function (
        toaster,
        gettextCatalog,
        MetadataFieldsRestService,
        MetadataBaseTypes
    ) {

        var service = {},
            subscriberCallbacks = [];

        /**
         * The list of metadata fields.
         * @type {Array}
         */
        service.fields = null;

        /**
         * Maps field PKs to field data.
         * @type {Object}
         */
        service.fieldMap = null;

        /**
         * Registers a client callback to be called when the fields have been loaded.
         * @param subscriberCallback
         */
        service.onFieldsLoaded = function (subscriberCallback) {
            subscriberCallbacks.push(subscriberCallback);

            // call the callback, if the fields have been loaded already
            if (service.fields) {
                subscriberCallback();
            }
        };

        /**
         * Gets a field from the field map.
         */
        service.getField = function (fieldPk) {
            return service.fieldMap[fieldPk];
        };

        /**
         * Gets the name of the base type of a field.
         */
        service.getBaseTypeName = function (fieldPk) {
            return service.getField(fieldPk).base_type;
        };

        /**
         * Gets the base type of a field.
         */
        service.getBaseType = function (fieldPk) {
            var baseTypeName = service.getBaseTypeName(fieldPk);

            if (MetadataBaseTypes.hasOwnProperty(baseTypeName)) {
                return MetadataBaseTypes[baseTypeName];
            }

            return null;
        };

        /**
         * Instantly adds the field to the provided list of fields.
         */
        service.addField = function (field) {
            service.fields.push(field);
            addFieldToMap(field);
        };


        /**
         * Loads the metadata fields from the API.
         */
        var loadMetadataFields = function () {
            MetadataFieldsRestService.query().$promise.then(
                function success (response) {
                    service.fields = response;
                    buildFieldsMap();
                    notifyFieldsLoaded();
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to load metadata fields"));
                    console.log(rejection);
                }
            );
        };

        /**
         * Builds a map (pk -> field object).
         */
        var buildFieldsMap = function () {
            service.fieldMap = {};

            for (var i = 0; i < service.fields.length; i++) {
                var field = service.fields[i];

                addFieldToMap(field);
            }
        };

        /**
         * Adds a field to the field map.
         */
        var addFieldToMap = function (field) {
            service.fieldMap[field.pk] = field;
        };

        /**
         * Notifies all subscribers that the fields have been loaded.
         */
        var notifyFieldsLoaded = function () {
            for (var i = 0; i < subscriberCallbacks.length; i++) {
                var subscriberCallback = subscriberCallbacks[i];

                subscriberCallback();
            }
        };

        // automatically load fields
        loadMetadataFields();

        return service;
    });
})();
