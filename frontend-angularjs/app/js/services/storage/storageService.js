/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * @class angular_service.StorageService
     * @memberOf angular_service
     * Defines an extension for ng-storage that creates a sub-storage called storageService.
     */
    module.factory('StorageService',
        function ($localStorage) {
            'ngInject';

            // create a default value for the sub-storage value storageService
            $localStorage.$default({
                storageService: {}
            });

            // define the storage object that we are going to return
            var obj = $localStorage.storageService;

            // and add a $reset method (because Dont Repeat Yourself...)
            obj.$reset = function () {
                console.log('obj.reset called!');
                for (var key in obj) {
                    // do not delete the $reset key
                    if (key == "$reset" || key == "reset" || !obj.hasOwnProperty(key)) {
                        continue;
                    }

                    delete obj[key];
                }
            };

            return obj;
        }
    );
})();
