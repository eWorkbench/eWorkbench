/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Provides common functionality for metadata objects.
     */
    module.service('MetadataService', function () {
        var service = {};

        service.initializeSelectionOptions = function (metadata, field) {
            var fieldAnswers = field.type_settings.answers;

            if (field.base_type === 'selection' && metadata.values.answers === undefined) {
                metadata.values.answers = [];
                for (var i = 0; i < fieldAnswers.length; i++) {
                    metadata.values.answers.push({
                        answer: fieldAnswers[i]
                    });
                }
            }
        };

        return service;
    });
})();
