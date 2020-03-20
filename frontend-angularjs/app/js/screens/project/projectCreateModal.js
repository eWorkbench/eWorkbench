/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    /**
     * Service for creating a project-create modal dialog
     */
    module.service('projectCreateModalService', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @returns {$uibModalInstance}
         */
        service.open = function (parentProject) {
            return $uibModal.open({
                templateUrl: 'js/screens/project/projectCreateModal.html',
                controller: 'ProjectCreateModalController',
                controllerAs: 'vm',
                backdrop: 'static', // do not close modal by clicking outside
                resolve: {
                    parentProject: function () {
                        return parentProject;
                    }
                }
            });
        };

        /**
         * View the supplied element
         * @param project
         * @param options state.go options
         * @returns {promise|void|angular.IPromise<any>|*}
         */
        service.viewElement = function (project, options) {
            return $state.go('project-view', {project: project}, options);
        };

        /**
         * Return the URL of the supplied element
         * @param project
         * @returns {string} the url
         */
        service.getViewUrl = function (project) {
            return $state.href("project-view", {project: project});
        };

        return service;
    });


    /**
     * Projects Create Controller
     *
     * Displays the Project Create Form
     */
    module.controller('ProjectCreateModalController', function (
        $scope,
        $uibModalInstance,
        AuthRestService,
        ProjectRestService,
        ProjectStateService,
        gettextCatalog,
        toaster,
        CalendarConfigurationService,
        IconImagesService,
        parentProject
    ) {
        'ngInject';

        var
            vm = this;

        this.$onInit = function () {
            vm.ProjectStateService = ProjectStateService;

            /**
             * Configuration of the datepicker.
             * @type {Object}
             */
            vm.datePickerOptions = CalendarConfigurationService.getOptions({
                format: CalendarConfigurationService.dateFormats.shortFormat,
                widgetPositioning: {horizontal: 'right', vertical: 'bottom'},
                allowInputToggle: true,
                showTodayButton: true
            });

            // copy date picker options for start date and stop date
            vm.datePickerOptionsStartDate = angular.copy(vm.datePickerOptions);
            vm.datePickerOptionsStopDate = angular.copy(vm.datePickerOptions);

            vm.canEditProject = true;

            vm.canEditProjectStorageSpaceRequirements = true;

            /**
             * The current user
             */
            vm.currentUser = AuthRestService.getCurrentUser();

            /**
             * init new project
             */
            vm.project = {parent_project: ''};

            /**
             * Dictionary containing errors
             * @type {{}}
             */
            vm.errors = {};

            /**
             * gets the correct icons
             */
            vm.alertIcon = IconImagesService.mainWarningIcons.alert;

            /**
             * marks that we are in create mode
             * @type {boolean}
             */
            vm.mode = 'create';

            // check parentProject and use it if available
            if (parentProject) {
                vm.project.parent_project = parentProject;
            }
        };

        /**
         * Update Date Picker maxDate and minDate
         */
        vm.updateDatePickerLimits = function () {
            if (vm.project.stop_date) {
                vm.datePickerOptionsStartDate.maxDate = vm.project.stop_date;
            } else {
                delete vm.datePickerOptionsStartDate.maxDate;
            }

            if (vm.project.start_date) {
                vm.datePickerOptionsStopDate.minDate = vm.project.start_date;
            } else {
                delete vm.datePickerOptionsStopDate.minDate;
            }
        };

        // deep watch projects and update date picker limits
        $scope.$watch('vm.project', vm.updateDatePickerLimits, true);

        /**
         * Call REST to create a new project
         */
        vm.create = function () {
            vm.errors = {};

            ProjectRestService.create(vm.project).$promise.then(
                function success (response) {
                    toaster.pop('success', gettextCatalog.getString("Project created"));

                    $uibModalInstance.close(response);
                },
                function error (rejection) {
                    console.log(rejection);
                    vm.errors = rejection.data;

                    if (rejection.data.detail) {
                        toaster.pop('error',
                            gettextCatalog.getString("Failed to create project"), rejection.data.detail
                        );
                    } else {
                        toaster.pop('error',
                            gettextCatalog.getString("Failed to create project")
                        );
                    }

                }
            );
        };

        /**
         * Dismiss the modal dialog
         */
        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        };
    });
})();
