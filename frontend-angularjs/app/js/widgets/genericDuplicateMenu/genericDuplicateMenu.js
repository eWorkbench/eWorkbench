/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A widget for duplicating model objects from menus
     */
    module.directive('genericDuplicateMenuWidget', function () {
        return {
            'restrict': 'E',
            'controller': 'GenericDuplicateMenuWidgetController',
            'templateUrl': 'js/widgets/genericDuplicateMenu/genericDuplicateMenu.html',
            'bindToController': true,
            'controllerAs': 'vm',
            'scope': {
                'baseModel': '=',
                'modelObject': '='
            }
        };
    });

    module.controller('GenericDuplicateMenuWidgetController', function (
        $window,
        $uibModal,
        IconImagesService,
        gettextCatalog,
        $injector,
        WorkbenchElementsTranslationsService,
        GenericModelService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.icons = IconImagesService.mainActionIcons;
        };

        /**
         * Shows a duplicate dialog
         */
        vm.duplicateModelObject = function () {
            // check if entityType is available in WorkbenchElementsTranslationsService
            if (!WorkbenchElementsTranslationsService.contentTypeToModelName[vm.baseModel.content_type_model]) {
                console.error("Unknown model type", vm.baseModel.content_type_model);

                return;
            }

            // duplicate resource
            var duplicatedObject = angular.copy(vm.baseModel);

            delete duplicatedObject.pk;
            delete duplicatedObject.created_at;
            delete duplicatedObject.created_by;
            delete duplicatedObject.last_modified_at;
            delete duplicatedObject.last_modified_by;
            delete duplicatedObject.url;
            delete duplicatedObject.display;
            delete duplicatedObject.deleted;
            delete duplicatedObject.version_number;
            delete duplicatedObject.$promise;
            delete duplicatedObject.$resolve;
            delete duplicatedObject.terms_of_use_pdf;

            // create a modal and wait for a result
            var modalService = GenericModelService.getCreateModalService(vm.baseModel);
            var modal = modalService.open(duplicatedObject);

            modal.result.then(modalService.viewElement);
        };
    });
})();
