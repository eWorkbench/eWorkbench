/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * A widget with a kebab menu for the detail view of workbench items (Tasks, Files, Notes, ...)
     */
    module.directive('genericDetailViewMenuWidget', function () {
        return {
            'restrict': 'E',
            'controller': 'GenericDetailViewMenuWidgetController',
            'templateUrl': 'js/widgets/genericDetailViewMenu/genericDetailViewMenu.html',
            'bindToController': true,
            'controllerAs': 'vm',
            'scope': {
                'baseModel': '=',
                'baseUrlModel': '@',
                'hasPrivileges': '=?',
                'hasNewElement': '=?',
                'hasRestore': '=?',
                'hasTrash': '=?',
                'hasSoftDelete': '=?',
                'hasDuplicate': '=?',
                'hasPrint': '=?',
                'hasExport': '=?',
                'hasShare': '=?'
            }
        };
    });

    module.controller('GenericDetailViewMenuWidgetController', function (
        $window,
        $uibModal,
        IconImagesService,
        toaster,
        gettextCatalog,
        confirmDialogWidget,
        ExportDataService,
        $injector,
        WorkbenchElementsTranslationsService,
        workbenchElements,
        projectCreateModalService,
        ProjectRestService,
        GenericModelService
    ) {
        "ngInject";

        var vm = this;

        this.$onInit = function () {
            vm.icons = IconImagesService.mainActionIcons;
        };

        /**
         * Opens modal dialog for privileges
         */
        vm.showPrivileges = function () {
            var modalInstance = $uibModal.open({
                templateUrl: 'js/screens/objectPrivileges/objectPrivilegesModalView.html',
                controller: 'ObjectPrivilegesModalViewController',
                controllerAs: 'vm',
                bindToController: true,
                resolve: {
                    baseUrlModel: function () {
                        return vm.baseUrlModel;
                    },
                    baseModel: function () {
                        return vm.baseModel;
                    }
                }
            });

            modalInstance.result.then(function (result) {
                console.log("modal closed with result", result);
            }).catch(function (reason) {
                console.log("Modal dismissed with reason", reason);
            });
        };

        /**
         * Provides a modal dialog asking the user to really trash an element
         */
        vm.reallyTrashObject = function () {
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Trash?'),
                message: gettextCatalog.getString('Do you really want to trash this element'),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Trash'),
                dialogKey: 'TrashElementFromDetailView'
            });

            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        vm.baseModel.$softDelete().then(
                            function success (response) {
                                vm.baseModel.$getCached();
                                toaster.pop('success', gettextCatalog.getString("Trashed"));
                            },
                            function error (rejection) {
                                console.log(rejection);
                                if (rejection.data && rejection.data.non_field_errors) {
                                    toaster.pop('error', gettextCatalog.getString("Trash failed"),
                                        rejection.data.non_field_errors.join(" ")
                                    );
                                } else {
                                    toaster.pop('error', gettextCatalog.getString("Trash failed"));
                                }
                            }
                        );
                    }
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }
            );
        };

        /**
         * Shows a restore dialog
         */
        vm.restoreObject = function () {
            vm.baseModel.$restore().then(
                function success (response) {
                    vm.baseModel.$getCached();
                    toaster.pop('success', gettextCatalog.getString("Restored"));
                },
                function error (rejection) {
                    console.log(rejection);
                    if (rejection.data && rejection.data.non_field_errors) {
                        toaster.pop('error', gettextCatalog.getString("Restore failed"),
                            rejection.data.non_field_errors.join(" ")
                        );
                    } else {
                        toaster.pop('error', gettextCatalog.getString("Restore failed"));
                    }
                }
            );
        };

        /**
         * Fetch url and open pdf in new window
         */
        vm.exportObject = function () {
            ExportDataService.doExport({model: vm.baseUrlModel, pk: vm.baseModel.pk});
        };

        /**
         * Opens modal dialog for creating a new element
         */
        vm.createNewElement = function () {
            var modalService = GenericModelService.getCreateModalService(vm.baseModel);

            if (modalService) {
                // create a modal and wait for a result
                var modal = modalService.open();

                modal.result.then(modalService.viewElement);
            }
        };

        /**
         * Shows a duplicate dialog
         */
        vm.duplicateObject = function () {
            // check if entityType is available in WorkbenchElementsTranslationsService
            if (WorkbenchElementsTranslationsService.contentTypeToModelName[vm.baseModel.content_type_model]) {

                var modelName = WorkbenchElementsTranslationsService
                    .contentTypeToModelName[vm.baseModel.content_type_model];

                // duplicate project
                if (modelName === workbenchElements.elements['projects.project'].modelName) {
                    vm.duplicateProject(vm.baseModel)
                } else {
                    // duplicate task, note, file, appointment, contacts
                    var duplicatedObject = vm.getBaseModelClone();

                    if (modelName === workbenchElements.elements['shared_elements.file'].modelName) {
                        duplicatedObject.path = vm.baseModel.pk;
                    }

                    // create a modal and wait for a result
                    var modalService = GenericModelService.getCreateModalServiceByModelName(modelName);
                    var modal = modalService.open(duplicatedObject);

                    modal.result.then(modalService.viewElement);
                }
            } else {
                console.error("In genericDetailViewMenu: Could not find entityType " + vm.baseModel.content_type_model);
            }
        };

        vm.getBaseModelClone = function () {
            var clone = angular.copy(vm.baseModel);

            delete clone.pk;
            delete clone.created_at;
            delete clone.created_by;
            delete clone.last_modified_at;
            delete clone.last_modified_by;
            delete clone.url;
            delete clone.display;
            delete clone.deleted;
            delete clone.version_number;
            delete clone.$promise;
            delete clone.$resolve;

            return clone;
        };

        /**
         * opens a modal dialog for sharing contact
         */
        vm.shareObject = function () {
            var sharedContact = vm.getBaseModelClone();

            var modelName = WorkbenchElementsTranslationsService
                .contentTypeToModelName[vm.baseModel.content_type_model];
            var modalService = $injector.get(modelName + "ShareModalService");
            var modal = modalService.open(sharedContact);

            modal.result.then(modalService.viewElement);
        };

        /**
         * Open a modal dialog that informs that the project with all sub projects will be duplicated
         */
        vm.duplicateProject = function (project) {
            // create modal dialog
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Duplicate project hierarchy?'),
                message: gettextCatalog.getString(
                    'Do you really want to duplicate the project with all sub projects?'
                ),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Duplicate'),
                dialogKey: 'DuplicateProject'
            });

            // react on the result of the modal dialog
            modalInstance.result.then(
                function confirm (doDuplicate) {
                    if (doDuplicate) {
                        // duplicate project
                        ProjectRestService.resource.duplicate({pk: project.pk}).$promise.then(
                            function success (response) {
                                // Duplicating the project created sub-projects, we should refresh all projects we have
                                // in our cache
                                ProjectRestService.query().$promise.then(
                                    function success () {
                                        toaster.pop('success', gettextCatalog.getString("Project duplicated"));

                                        projectCreateModalService.viewElement(response);
                                    }
                                );
                            },
                            function error (rejection) {
                                console.log(rejection);
                                vm.errors = rejection.data;

                                if (rejection.data.detail) {
                                    toaster.pop('error',
                                        gettextCatalog.getString("Failed to duplicate project"), rejection.data.detail
                                    );
                                } else {
                                    toaster.pop('error',
                                        gettextCatalog.getString("Failed to duplicate project")
                                    );
                                }

                            }
                        );
                    }
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }
            );
        }
    });
})();
