/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A directive for the 'New' tab of the modal window for creating a new relation
     */
    module.directive('genericCreateWidget', function () {
        return {
            templateUrl: 'js/widgets/genericCreateWidget/genericCreateWidget.html',
            controller: 'GenericCreateWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                modelObject: '=',
                createFormConfig: '=',
                createCallback: '&',
                cancelCallback: '&',
                errors: '='
            }
        }
    });

    module.controller('GenericCreateWidgetController', function (ProjectRestService, IconImagesService) {
        "ngInject";

        var
            vm = this;

        this.$onInit = function () {
            /**
             * gets the correct alert icon
             */
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;
        };

        /**
         * DatePicker Options
         * @type {
         * {format: string, widgetPositioning: {horizontal: string, vertical: string},
         * allowInputToggle: boolean, showTodayButton: boolean}}
         */
        vm.datePickerOptions = {
            format: 'DD. MM. YYYY, HH:mm',
            widgetPositioning: {horizontal: 'right', vertical: 'bottom'},
            allowInputToggle: true,
            showTodayButton: true
        };


        /**
         * A list of users for the current project
         * @type {Array}
         */
        vm.users = [];


        /**
         * Gets the user for the current project
         */
        vm.getUsersForCurrentProject = function () {
            return ProjectRestService.resource.searchUser(
                // {pk: vm.projectId}
            ).$promise.then(function success (response) {
                vm.users = response;
            });
        };

        vm.getUsersForCurrentProject();

        /**
         * user pressed the cancel button in the modal dialog
         */
        vm.cancel = function () {
            vm.cancelCallback({});
        };

        /**
         * returns the created item
         */
        vm.save = function () {
            vm.createCallback({item: vm.modelObject});
        };
    });
})();
