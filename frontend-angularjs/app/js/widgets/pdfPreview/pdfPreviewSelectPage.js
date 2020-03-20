/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";


    var module = angular.module('widgets');

    module.service('pdfPreviewSelectPageService', function ($uibModal) {
        var service = {};

        service.openModal = function (pdf) {
            return $uibModal.open({
                templateUrl: 'js/widgets/pdfPreview/pdfPreviewSelectPage.html',
                controller: 'PDFPreviewSelectPageController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    pdf: function () {
                        return pdf;
                    }
                }
            });
        };

        return service;
    });

    module.controller('PDFPreviewSelectPageController', function (
        $scope,
        $uibModalInstance,
        pdf
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.currentPage = 1;
            vm.numPages = pdf.numPages;
        };

        var renderPage = function (page) {
            var viewport = page.getViewport(0.9 * jQuery(".canvas-holder").width() / page.getViewport(1.0).width);
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // make canvas holder is empty
            jQuery(".canvas-holder").empty();
            // and append the new canvas holder
            jQuery(".canvas-holder").append(canvas);

            page.render(renderContext);
        };


        var selectPage = function (pageNumber) {
            pdf.getPage(pageNumber).then(renderPage);
        };

        $scope.$watch("vm.currentPage", function () {
            selectPage(vm.currentPage);
        });

        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };

        vm.selectPage = function () {
            $uibModalInstance.close(vm.currentPage);
        };

        vm.goToNextPage = function () {
            vm.currentPage += 1;

            if (vm.currentPage > vm.numPages) {
                vm.currentPage = vm.numPages;
            }
        };

        vm.goToPreviousPage = function () {
            vm.currentPage -= 1;

            if (vm.currentPage < 1) {
                vm.currentPage = 1;
            }
        };
    })
})();
