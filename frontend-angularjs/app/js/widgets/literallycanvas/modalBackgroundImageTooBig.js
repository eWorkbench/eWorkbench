/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * Controller for a Modal Dialog that asks the user whether the image should be resized to match the canvas,
     * or the canvas should be resized to match the image
     */
    module.controller('ModalBackgroundImageTooBigController', function (
        $scope,
        $uibModalInstance,
        imageSize,
        canvasSize
    ) {
        var vm = this;

        vm.imageSize = imageSize;

        vm.canvasSize = canvasSize;

        vm.resizeImage = function () {
            $uibModalInstance.close(true);
        };

        vm.resizeCanvas = function () {
            $uibModalInstance.close(false);
        };

        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
