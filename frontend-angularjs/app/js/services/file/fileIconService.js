/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Service for providing file icon images based on the lowercased file extension (e.g., .docx or .png)
     */
    module.factory('FileIconService', function () {
        'ngInject';

        /**
         * Defines File Type Icons by their lowercased file extension
         * @type {{}}
         */
        var fileTypeIcons = {
            // text icon: fa fa-file-text-o
            "doc": "fa fa-file-text-o",
            "docx": "fa fa-file-text-o",
            "odt": "fa fa-file-text-o",
            "txt": "fa fa-file-text-o",
            "text": "fa fa-file-text-o",
            "log": "fa fa-file-text-o",

            // pdf icon: fa fa-file-pdf-o
            "pdf": "fa fa-file-pdf-o",

            // image icon:  fa fa-file-image-o
            "png": "fa fa-file-image-o",
            "jpg": "fa fa-file-image-o",
            "jpe": "fa fa-file-image-o",
            "jpeg": "fa fa-file-image-o",
            "bmp": "fa fa-file-image-o",
            "gif": "fa fa-file-image-o",
            "psd": "fa fa-file-image-o",
            "svg": "fa fa-file-image-o",
            "tiff": "fa fa-file-image-o",

            // excel, csv: fa fa-file-excel-o
            "xls": "fa fa-file-excel-o",
            "xlsx": "fa fa-file-excel-o",
            "csv": "fa fa-file-excel-o",
            "ods": "fa fa-file-excel-o",

            // default
            "default": "fa fa-download"
        };

        var service = {
            'download': 'fa fa-download',
            'getFileTypeIcon': function (fileName) {
                // get file ending in lowercase
                var ending =  fileName.split('.').pop().toLowerCase();

                if (fileTypeIcons[ending]) {
                    return fileTypeIcons[ending];
                }

                return fileTypeIcons["default"];
            }
        };

        return service;
    });

})();
