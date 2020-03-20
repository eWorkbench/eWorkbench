/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('screens');

    /**
     * Service for creating a modal dialog for the CreateRelation screen
     */
    module.service('createRelationModalDialogService', function ($uibModal) {
        "ngInject";

        var service = {};

        service.openModal = function (model, baseModel, relatedModelsWithIcons) {
            return $uibModal.open({
                backdrop: 'static',
                templateUrl: 'js/screens/relation/createRelation.html',
                controller: 'CreateRelationModalController',
                controllerAs: 'vm',
                size: 'lg',
                windowClass: 'createRelation',
                resolve: {
                    model: function () {
                        return model;
                    },
                    modelPk: function () {
                        return baseModel.pk;
                    },
                    relatedModelsWithIcons: function () {
                        return relatedModelsWithIcons;
                    }
                }
            });
        };

        return service;
    });

    /**
     * Controller for handling creating a new relation in a modal dialog
     * Allows searching for an existing element, or also creating a new one (Task, Meeting, Note, Contact, File)
     */
    module.controller('CreateRelationModalController', function (
        $injector,
        $scope,
        $uibModalInstance,
        model,
        modelPk,
        relatedModelsWithIcons,
        DmpRestService,
        ProjectRestService,
        IconImagesService,
        WorkbenchElementsTranslationsService,
        GenericModelService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.relatedModelsWithIcons = relatedModelsWithIcons;

            vm.model = model;

            /**
             * Primary Key of the element that this relation is going to be created for
             * @type {*}
             */
            vm.modelId = modelPk;

            /**
             * save all selected items of the search results for each tab
             * @type {{}}
             */
            vm.allSelectedItems = {};

            for (var j = 0; j < vm.relatedModelsWithIcons.length; j++) {
                var tabModel = vm.relatedModelsWithIcons[j];

                vm.allSelectedItems[tabModel.key] = [];
            }

            vm.addButtonEnabled = false;
            vm.addButtonText = "Add link";

            vm.tabTitle = {};
            vm.updateTabTitles();

            /**
             * Defines the columns of each model for the search result table
             */
            vm.searchTableColumnConfig = {
                'dmp': [
                    {
                        'field': 'title',
                        'display': "{{ $result['title'] }}"
                    },
                    {
                        'field': 'dmp_form',
                        'display': '<dmp-form-name-display-widget dmp-form-pk="$result[\'dmp_form\']">' +
                            '</dmp-form-name-display-widget>'
                    },
                    {
                        'field': 'created_by.username',
                        'display': '<user-display-widget user="$result[\'created_by\']"></user-display-widget>'
                    },
                    {
                        'field': 'created_at',
                        'display': "{{ $result['created_at'] | smallDate }}"
                    }
                ],
                'note': [
                    {
                        'field': 'subject',
                        'display': "{{ $result['subject'] }}"
                    },
                    {
                        'field': 'created_by.username',
                        'display': '<user-display-widget user="$result[\'created_by\']"></user-display-widget>'
                    },
                    {
                        'field': 'created_at',
                        'display': "{{ $result['created_at'] | smallDate }}"
                    }
                ],
                'task': [
                    {
                        'field': 'task_id',
                        'display': "#{{ $result['task_id'] }}"
                    },
                    {
                        'field': 'title',
                        'display': "{{ $result['title'] }}"
                    },
                    {
                        'field': 'priority',
                        'display': "<task-state-priority-display-widget task-priority=\"$result['priority']\"></task-state-priority-display-widget>"
                    },
                    {
                        'field': 'state',
                        'display': "<task-state-priority-display-widget task-state=\"$result['state']\"></task-state-priority-display-widget>"
                    },
                    {
                        'field': 'created_by.username',
                        'display': '<user-display-widget user="$result[\'created_by\']"></user-display-widget>'
                    },
                    {
                        'field': 'created_at',
                        'display': "{{ $result['created_at'] | smallDate }}"
                    }
                ],
                'meeting': [
                    {
                        'field': 'title',
                        'display': "{{ $result['title'] }}"
                    },
                    {
                        'field': 'date_time_start',
                        'display':
                            "{{ $result['date_time_start'] | smallDate }} - {{ $result['date_time_end'] | smallDate }}"
                    },
                    {
                        'field': 'created_by.username',
                        'display': '<user-display-widget user="$result[\'created_by\']"></user-display-widget>'
                    },
                    {
                        'field': 'created_at',
                        'display': "{{ $result['created_at'] | smallDate }}"
                    }
                ],
                'file': [
                    {
                        'field': 'name',
                        'display': "{{ $result['name'] }}"
                    },
                    {
                        'field': 'created_by.username',
                        'display': '<user-display-widget user="$result[\'created_by\']"></user-display-widget>'
                    },
                    {
                        'field': 'created_at',
                        'display': "{{ $result['created_at'] |smallDate }}"
                    }
                ],
                'contact': [
                    {
                        'field': 'first_name',
                        'display': "{{ $result['first_name'] }}"
                    },
                    {
                        'field': 'last_name',
                        'display': "{{ $result['last_name'] }}"
                    },
                    {
                        'field': 'created_by.username',
                        'display': '<user-display-widget user="$result[\'created_by\']"></user-display-widget>'
                    },
                    {
                        'field': 'created_at',
                        'display': "{{ $result['created_at'] | smallDate }}"
                    }
                ],
                'labbook': [
                    {
                        'field': 'title',
                        'display': "{{ $result['title'] }}"
                    },
                    {
                        'field': 'created_by.username',
                        'display': '<user-display-widget user="$result[\'created_by\']"></user-display-widget>'
                    },
                    {
                        'field': 'created_at',
                        'display': "{{ $result['created_at'] | smallDate }}"
                    }
                ],
                'picture': [
                    {
                        'field': 'title',
                        'display': "{{ $result['title'] }}"
                    },
                    {
                        'field': 'download_rendered_image',
                        'display': '<my-image image-src="$result[\'download_rendered_image\']" style="max-width: 100%; height: 50px">'
                    }
                ],
                'kanbanboard': [
                    {
                        'field': 'title',
                        'display': "{{ $result['title'] }}"
                    },
                    {
                        'field': 'created_by.username',
                        'display': '<user-display-widget user="$result[\'created_by\']"></user-display-widget>'
                    },
                    {
                        'field': 'created_at',
                        'display': "{{ $result['created_at'] | smallDate }}"
                    }
                ],
                'drive': [
                    {
                        'field': 'title',
                        'display': "{{ $result['title'] }}"
                    },
                    {
                        'field': 'created_by.username',
                        'display': '<user-display-widget user="$result[\'created_by\']"></user-display-widget>'
                    },
                    {
                        'field': 'created_at',
                        'display': "{{ $result['created_at'] | smallDate }}"
                    }
                ],
                'project': [
                    {
                        'field': 'name',
                        'display': "{{ $result['name'] }}"
                    },
                    {
                        'field': 'created_by.username',
                        'display': '<user-display-widget user="$result[\'created_by\']"></user-display-widget>'
                    },
                    {
                        'field': 'created_at',
                        'display': "{{ $result['created_at'] | smallDate }}"
                    }
                ]
            };

            // create titles of each of the columns for each element
            for (var columnKey in vm.searchTableColumnConfig) {
                if (vm.searchTableColumnConfig.hasOwnProperty(columnKey)) {
                    var lowerCaseModelName = columnKey.toLowerCase();
                    var fields = vm.searchTableColumnConfig[columnKey];

                    // iterate over all fields and set the respective title
                    for (var i = 0; i < fields.length; i++) {
                        var field = fields[i];

                        field.title = WorkbenchElementsTranslationsService
                            .translateFieldName(lowerCaseModelName, field.field);
                    }
                }
            }

            /**
             * save the errors which are received from the REST API
             * @type {{}}
             */
            vm.errors = {};
        };

        vm.updateTabTitles = function () {
            for (var j = 0; j < vm.relatedModelsWithIcons.length; j++) {
                var tabModel = vm.relatedModelsWithIcons[j],
                    selectionCount = vm.allSelectedItems[tabModel.key].length;

                vm.tabTitle[tabModel.key] = tabModel.title;
                if (selectionCount > 0) {
                    vm.tabTitle[tabModel.key] += ' (' + selectionCount + ')';
                }
            }
        };

        /**
         * Dismiss the dialog
         */
        vm.cancel = function () {
            $uibModalInstance.dismiss();
        };

        /**
         * Create a new entity via the modal services
         */
        vm.createNewEntity = function () {
            var modalInstance = null,
                modelName = vm.model.modelName,
                modalService = GenericModelService.getCreateModalServiceByModelName(modelName);

            if (modalService) {
                // open the modal and wait for a result
                modalInstance = modalService.open();

                // close the existing modal and use the result of the new modal dialog
                if (modalInstance) {
                    $uibModalInstance.close(modalInstance.result);
                }
            }
        };

        vm.createSelectedLinks = function () {
            $uibModalInstance.close(vm.allSelectedItems);
        };

        vm.countSelectedItems = function () {
            var count = 0;

            for (var i = 0; i < vm.relatedModelsWithIcons.length; i++) {
                var modelKey = vm.relatedModelsWithIcons[i].key,
                    selectedItems = vm.allSelectedItems[modelKey];

                count += selectedItems.length;
            }

            return count;
        };

        // updates displayed information when the selection inside a tab changes
        vm.onTabSelectionChanged = function () {
            var count = vm.countSelectedItems();

            vm.addButtonText = vm.countSelectedItems() > 1
                ? 'Add ' + count + ' links'
                : 'Add link';

            vm.addButtonEnabled = (count > 0);

            vm.updateTabTitles();
        };
    });
})();
