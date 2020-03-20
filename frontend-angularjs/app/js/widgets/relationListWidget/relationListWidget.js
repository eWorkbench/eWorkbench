/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('widgets');

    /**
     * @ngdoc directive
     *
     * @name relationListWidget
     *
     * @memberOf module:widgets
     *
     * @restrict E
     *
     * @description
     * Display, create, delete and update of relations of the provided baseModel
     */
    module.directive('relationListWidget', function () {
        return {
            restrict: 'E',
            controller: 'RelationListWidgetController',
            templateUrl: 'js/widgets/relationListWidget/relationListWidget.html',
            scope: {
                baseModel: '=',
                baseUrlModel: '@'
            },
            bindToController: true,
            controllerAs: 'vm'
        }
    });

    module.controller('RelationListWidgetController', function (
        $scope,
        $uibModal,
        $timeout,
        IconImagesService,
        RelationsRestServiceFactory,
        createRelationModalDialogService,
        gettextCatalog,
        toaster,
        HistoryModelTypeService,
        WorkbenchElementChangesWebSocket,
        WorkbenchElementsTranslationsService,
        RelateableModelService,
        DynamicTableSettingsService
    ) {
        "ngInject";

        var vm = this;

        /**
         * The relations for this model
         * @type {Array}
         */
        vm.relations = [];

        this.$onInit = function () {
            if (!vm.currentView) {
                vm.currentView = 'list';
            }

            /**
             * Used to create a new relation
             * @type {{}}
             */
            vm.relationObject = {};

            /**
             * DatePicker Options
             * @type {
             * {format: string,
             *  widgetPositioning: {horizontal: string, vertical: string},
             *  allowInputToggle: boolean, showTodayButton: boolean}
             * }
             */
            vm.datePickerOptions = {
                format: 'DD. MM. YYYY, HH:mm',
                widgetPositioning: {horizontal: 'right', vertical: 'bottom'},
                allowInputToggle: true,
                showTodayButton: true
            };

            /**
             * specify the default value of the date filter
             * and save the selected option
             * @type {string}
             */
            vm.relationFilterDateSelected = '-created_at';

            /**
             * Dictionary which contains all relatable models and their translated name
             * @type {{}}
             */
            vm.relationFilterModel = {};

            /**
             * Dictionary which contains all relatable models with their icons, sorted by title
             * @type {Array}
             */
            vm.relatedModelsWithIcons = RelateableModelService.getRelateableModelsWithIcons();
            vm.relatedModelsWithIcons.sort(function (a, b) {
                return a["title"].localeCompare(b["title"]);
            });

            /**
             * filters for the request
             */
            vm.filters = {};

            /**
             * save the selected model filter
             * @type {string}
             */
            vm.relationFilterModelSelected = '';

            /**
             * whether the relation data has been loaded
             * @type {boolean}
             */
            vm.relationLoaded = false;

            /**
             * Stores a dictioanry with the main element icons
             * @type {{}}
             */
            vm.mainElementIcons = IconImagesService.mainElementIcons;

            vm.relationsService = RelationsRestServiceFactory(vm.baseUrlModel, vm.baseModel.pk);

            var baseContentType = vm.baseModel.content_type_model;
            var modelName = WorkbenchElementsTranslationsService
                .contentTypeToModelName[baseContentType].toLowerCase();

            /**
             * Initialize WebSocket: Subscribe to changes on the websocket
             */
            var wsUnsubscribeFunction = WorkbenchElementChangesWebSocket.subscribe(
                modelName, vm.baseModel.pk, function onChange (jsonMessage) {
                    if (jsonMessage['element_relations_changed']) {
                        vm.getRelations(true);
                    }
                }
            );

            /**
             * default sorting
             */
            vm.defaultOrderBy = "created_at";
            vm.defaultOrderDir = "desc";
            vm.orderBy = vm.defaultOrderBy;
            vm.orderDir = vm.defaultOrderDir;

            var sortOptions = DynamicTableSettingsService.getColumnSortingAndMatchNameToField('grid_state_relations');

            if (sortOptions['sortField']) {
                vm.orderBy = sortOptions['sortField'];
            }

            if (sortOptions['sortDir']) {
                vm.orderDir = sortOptions['sortDir'];
            }

            /**
             * get relations, then create a watcher
             */
            vm.getRelations(true);

            /**
             * On Destroy, unsubscribe from the websocket
             */
            $scope.$on('$destroy', function () {
                wsUnsubscribeFunction();
            });

            /**
             * If relations have changed, reload them
             */
            $scope.$on('relations-changed', function (event, args) {
                console.log('relations changed, reloading...');
                vm.getRelations();
                event.stopPropagation();
            });
        };

        vm.addRelationElementType = function () {
            for (var i = 0; i < vm.relations.length; i++) {
                var relation = vm.relations[i];

                // the other (non-baseModel) element is the linked element
                relation["table_object"] = (relation.right_object_id === vm.baseModel.pk)
                    ? relation["left_content_object"]
                    : relation["right_content_object"];

                var linkedElement = relation['table_object'];

                // add more information if there is a linked element
                // if there is no linked element, we don't have permission to see it
                if (linkedElement) {
                    var contentTypeModel = linkedElement["content_type_model"];
                    var name = WorkbenchElementsTranslationsService.contentTypeToModelName[contentTypeModel];
                    var translatedName = WorkbenchElementsTranslationsService.modelNameToTranslation[name];

                    linkedElement["content_type_name"] = name;
                    linkedElement["content_type_name_translated"] = translatedName;
                    linkedElement["content_type_icon"] = IconImagesService.mainElementIcons[name];
                }
            }
        };

        /**
         * Gets the relations for this element
         */
        vm.getRelations = function (noCache, ignoreLoadingBar) {
            var promise = null;

            if (vm.orderBy && vm.orderDir) {
                vm.filters['ordering'] = (vm.orderDir === 'asc' ? '' : '-') + vm.orderBy;
            }

            if (noCache) {
                promise = RelationsRestServiceFactory(
                    vm.baseUrlModel, vm.baseModel.pk, ignoreLoadingBar
                ).query(vm.filters).$promise;
            } else {
                promise = vm.relationsService.queryCached().$promise;
            }

            return promise.then(
                function success (response) {
                    var tmpResponse = [];

                    for (var i = 0; i < response.length; i++) {
                        var relation = response[i];

                        // if the content_object is empty, it means that the backend is not allowing to view the element
                        if ((relation.right_object_id === vm.baseModel.pk && relation.left_content_object)
                            || (relation.left_object_id === vm.baseModel.pk && relation.right_content_object)) {
                            tmpResponse.push(relation);
                        }
                    }

                    vm.relations = tmpResponse;
                    vm.addRelationElementType();
                    vm.relationLoaded = true;
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to load links"));
                    console.log(rejection);
                }
            );
        };

        /**
         * opens a modal dialog for creating a new relation
         * @param model {{}} specify with which model the relation should be created
         *                    (etc. Task, Meeting, File, Contact, Note)
         */
        vm.createGenericRelation = function (model) {
            // open modal dialog
            var modalInstance = createRelationModalDialogService.openModal(
                model, vm.baseModel, vm.relatedModelsWithIcons
            );

            // process the result of the modal dialog
            modalInstance.result.then(
                function okay (objects) {
                    var arrayCheck = Array.isArray(objects["dmp.dmp"]);

                    if (!arrayCheck) {
                        var tmpObject = objects;
                        var tmpArray = [];

                        tmpArray.push(tmpObject);
                        objects = {};
                        objects[tmpObject["content_type_model"]] = tmpArray;
                    }


                    for (var j = 0; j < vm.relatedModelsWithIcons.length; j++) {
                        var modelKey = vm.relatedModelsWithIcons[j].key,
                            selectedItems = objects[modelKey];

                        if (!selectedItems) {
                            continue;
                        }

                        for (var i = 0; i < selectedItems.length; i++) {
                            /**
                             * create new relation between the current model
                             * and the selected model (etc. Task, Meeting, File,
                             * Contact, Note)
                             * @type {{right_content_type: *, right_object_id, left_content_type: *, left_object_id}}
                             */
                            vm.relationObject = {
                                // right: is always the current model
                                right_content_type: vm.baseModel.content_type,
                                right_object_id: vm.baseModel.pk,
                                // left: the newly created model
                                left_content_type: selectedItems[i].content_type,
                                left_object_id: selectedItems[i].pk
                            };

                            // call REST API to create the new relation
                            vm.relationsService.create(vm.relationObject).$promise.then(
                                function success (response) {
                                    vm.getRelations(); // responsible for loading the latest elements
                                    toaster.pop('success',
                                        gettextCatalog.getString("Created"),
                                        gettextCatalog.getString("A new link has been created")
                                    );
                                },
                                function error (rejection) {
                                    toaster.pop('error', gettextCatalog.getString("Failed to create link"));
                                    console.log(rejection);
                                }
                            )
                        }
                    }
                },
                function dismiss () {
                    console.log('modal dialog dismissed');
                }

            );
        };

        /**
         * Filter trashed elements
         * @param relation
         */
        vm.filterTrashed = function (relation) {
            if (relation.left_object_id != vm.baseModel.pk
                && relation.left_content_object && relation.left_content_object.deleted) {
                return false;
            } else if (relation.right_object_id != vm.baseModel.pk
                && relation.right_content_object && relation.right_content_object.deleted) {
                return false;
            }

            return true;
        };

        /**
         * Filters the model type of the relations
         * @param relation
         * @returns {boolean}
         */
        vm.filterModelType = function (relation) {
            if (!vm.relationFilterModelSelected || vm.relationFilterModelSelected == '') { // none selected
                return true;
            } // allow all

            // if a model is selected, check that either left or right content type are equal
            return (
                (
                    relation.left_content_type_model == vm.relationFilterModelSelected &&
                    relation.left_object_id != vm.baseModel.pk) ||
                (
                    relation.right_content_type_model == vm.relationFilterModelSelected &&
                    relation.right_object_id != vm.baseModel.pk)
            );
        };

        $scope.$watch("vm.cardViewTitle", function () {
            if (!vm.cardViewTitle) {
                vm.cardViewTitle = gettextCatalog.getString("Card View");
            }
        });

        $scope.$watch("vm.listViewTitle", function () {
            if (!vm.listViewTitle) {
                vm.listViewTitle = gettextCatalog.getString("List View");
            }
        });

        $scope.$watch("[vm.orderBy, vm.orderDir]", function (newValue, oldValue) {
            /**
             *  When the user changes the column-ordering, vm.gridApi.core.on.sortChanged() in tableViewGrid
             *  is triggered, which then modifies vm.orderBy and vm.orderDir. This change is detected here
             *  and get<Element>() is executed with the ordering-filter using the new values of orderBy/orderDir
            */
            if ((newValue[0] === null) && (oldValue[0] !== vm.defaultOrderBy)) {
                // triggered when the sorting is reset (i.e. when newValue[0] is null),
                // defaultOrderBy/defaultOrderDir is applied to the order-filter.
                // Only applies when the change didn't occur from the default to null (e.g. on page-loading)
                vm.orderBy = vm.defaultOrderBy;
                vm.orderDir = vm.defaultOrderDir;
                vm.getRelations(true, false);
            }
            if ((newValue !== oldValue) && (vm.orderBy !== null)) {
                // triggered when sorting by column or direction has changed (But not on sort-reset)
                vm.getRelations(true, false);
            }
        }, true);
    });
})();
