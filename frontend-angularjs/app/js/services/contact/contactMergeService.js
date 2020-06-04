/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var
        module = angular.module('services');

    /**
     * Service to merge contact data
     */
    module.factory('ContactMergeService', function () {
        'ngInject';

        var service = {};

        /**
         * Merges all data of the given contacts into a new object.
         * @param contact1
         * @param contact2
         */
        service.merge = function (contact1, contact2) {
            var contact = angular.copy(contact1);

            mergeArrayField(contact, contact2, 'academic_title');
            mergeArrayField(contact, contact2, 'first_name');
            mergeArrayField(contact, contact2, 'last_name');
            mergeArrayField(contact, contact2, 'email');
            mergeArrayField(contact, contact2, 'phone');
            mergeArrayField(contact, contact2, 'company');
            mergeArrayField(contact, contact2, 'metadata');

            return contact;
        };

        /**
         * Merges the ArrayField of contact2 into contact1.
         */
        function mergeArrayField (contact1, contact2, fieldName) {
            // merge all ArrayField values into contact1
            for (var i = 0; i < contact2[fieldName].length; i++) {
                var value = contact2[fieldName][i];

                // append value, if it is not contained yet
                if (contact1[fieldName].indexOf(value) < 0) {
                    contact1[fieldName].push(value);
                }
            }
        }

        return service;
    });
})();
