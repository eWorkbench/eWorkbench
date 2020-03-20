/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('ngImageResize', []);

    /**
     * An AngularJS Service for resizing images
     *
     * Provides a resizeImage Method, which takes the original image, a new width and a new height
     *
     */
    module.service('resizeImageService', function ($q) {
        "ngInject";

        var service = {};

        /**
         * Resizes the given image
         * @param originalImage - must be of type Image (e.g., new Image().src = "http://some-domain.com/image.png")
         * @param newWidth
         * @param newHeight
         * @returns {promise} Once resized, this promise will resolve a blob containing the resized image
         */
        service.resizeImage = function (originalImage, newWidth, newHeight) {
            var defer = $q.defer();

            // step 1: resize
            var oc = document.createElement('canvas'),
                octx = oc.getContext('2d');

            oc.width = newWidth;
            oc.height = newHeight;

            octx.drawImage(originalImage, 0, 0, oc.width, oc.height);

            // step 2: convert the canvas to a blob
            oc.toBlob(function (blob) {
                defer.resolve(blob);
            });

            return defer.promise;
        };

        return service;
    });
})();
