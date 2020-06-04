/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('shared');


    /**
     * Opens a file picker and lets the user select a file for upload
     */
    module.factory('selectFileWithPicker', function ($q) {
        "ngInject";

        /**
         * Opens a file picker and lets the user select a file for upload
         *
         * @param {string} acceptFileType the file type that should be accepted (e.g., image/png)
         * @param {boolean} multipleFiles
         * @returns a promise, which is resolved when a file is selected (it is never rejected though)
         */
        return function (acceptFileType, multipleFiles) {
            var defer = $q.defer();

            // "fake" an input element of type file
            var input = document.createElement('input');

            // set the type of the input element to file
            input.setAttribute('type', 'file');

            // whether or not to accept multiple files
            if (typeof multipleFiles !== "undefined" && multipleFiles) {
                input.setAttribute('multiple', '');
            }

            // if we only accept certain file types
            if (typeof acceptFileType !== "undefined" && acceptFileType) {
                input.setAttribute('accept', acceptFileType);
            }

            // wait for an onchange event
            input.onchange = function () {
                defer.resolve(this.files);
            };

            // click it
            // FIXME: Some browsers deny click events (in some cases), if the element is not visible to the user
            input.click();

            return defer.promise;
        };
    });
})();
