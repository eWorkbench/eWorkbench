/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('services');

    /**
     * Provides methods to navigate to or reload model views.
     */
    module.service('NavigationService', function (
        $state,
        $injector,
        $window,
        WorkbenchElementsTranslationsService,
        GenericModelService
    ) {

        var service = {};

        var goToModelView = function (model, reload) {
            var modalService = GenericModelService.getCreateModalService(model);

            if (modalService) {
                if (model.$getCached) {
                    model.$getCached().then(function () {
                        modalService.viewElement(model, {'reload': reload});
                    });
                } else {
                    modalService.viewElement(model, {'reload': reload});
                }
            }
        };

        /**
         * Navigates to the detail view of the given model.
         * @param model
         */
        service.goToModelView = function (model) {
            goToModelView(model, false);
        };

        /**
         * Reloads the detail view of the given model.
         * @param model
         */
        service.reloadModelView = function (model) {
            goToModelView(model, true);
        };

        service.getModelViewUrl = function (model) {
            var contentType = model.content_type_model,
                modelName = WorkbenchElementsTranslationsService.contentTypeToModelName[contentType],
                viewName = modelName.toLowerCase() + '-view',
                stateParams = {};

            stateParams[modelName] = model;

            return $state.href(viewName, stateParams);
        };

        /**
         * Reloads the current page.
         */
        service.reloadPage = function () {
            $state.reload();
            // $window.location.reload();
        };

        return service;
    });
})();
