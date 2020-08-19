/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    "use strict";

    var module = angular.module('screens');

    /**
     * Service for choosing a plugin and setting location of new plugin instance modal dialog
     */
    module.service('newPluginSelectionModalService', function (
        $state,
        $uibModal
    ) {
        var service = {};

        /**
         * Opens the modal dialog
         * @return {$uibModalInstance}
         */
        service.open = function (
            labbookChildElements,
            labbook,
            currentPluginModalPage,
            currentlyViewedPlugin,
            detailOnly
        ) {
            return $uibModal.open({
                controller: 'SelectPluginModalController',
                templateUrl: 'js/screens/plugin/selectPluginModal.html',
                controllerAs: 'vm',
                backdrop: 'static',
                size: 'lg',
                resolve: {
                    'labbookChildElements': function () {
                        return labbookChildElements;
                    },
                    'labbook': function () {
                        return labbook;
                    },
                    'currentPluginModalPage': function () {
                        return currentPluginModalPage;
                    },
                    'currentlyViewedPlugin': function () {
                        return currentlyViewedPlugin;
                    },
                    'detailOnly': function () {
                        return detailOnly;
                    }
                }
            })
        };

        return service;
    });


    /**
     * Controller for selecting a plugin and it's position in a labbook
     */
    module.controller('SelectPluginModalController', function (
        $scope,
        $timeout,
        $uibModalInstance,
        PluginRestService,
        IconImagesService,
        LabbookChildElementsRestService,
        labbookChildElements,
        labbook,
        currentPluginModalPage,
        detailOnly,
        currentlyViewedPlugin,
        gettextCatalog,
        toaster
    ) {
        var vm = this;

        this.$onInit = function () {


            /**
             * A list of plugins
             * @type {Array}
             */
            vm.plugins = [];

            /**
             * Determine the current view in the modal
             * @type {string}
             */
            if (currentPluginModalPage === undefined) {
                vm.currentPluginModalPage = 'step1'
            } else {
                vm.currentPluginModalPage = currentPluginModalPage;
            }

            /**
             * Determines if there are only close buttons in "pluginDetailView.html", in order to
             * create a modal-dialog that only contains the plugin detail, but no other pages
             * @type {bool}
             */
            vm.detailOnly = detailOnly !== undefined;

            /**
             * String to display the page that is currently set to go back to
             */
            vm.backToPreviousPageString = 'Back to overview';

            /**
             * The currently selected plugin
             * @type {object}
             */
            vm.selectedPlugin = {};

            /**
             * The currently viewed plugin
             * @type {null}
             */
            if (currentlyViewedPlugin === undefined) {
                vm.currentlyViewedPlugin = {};
            } else {
                vm.currentlyViewedPlugin = currentlyViewedPlugin;
            }

            /**
             * a plugin has been selected
             * @type {bool}
             */
            vm.selectionHasBeenMade = false;

            /**
             * A string for filtering plugins
             * @type {string}
             */
            vm.searchField = undefined;

            /**
             * filters for the request
             */
            vm.filters = {};

            /**
             * A flag for filtering tasks
             * @type {boolean}
             */
            vm.onlyPluginsWithAccess = true;

            /**
             * Model for feedback/request-access forms
             * @type {object}
             */
            vm.feedback = {};

            vm.labbookChildElements = labbookChildElements;
            vm.labbook = labbook;
            vm.location = 'bottom';
            vm.parent = 'labbook';

            /**
             * REST Service for Labbook Child Elements
             */
            vm.labbookChildElementRestService = LabbookChildElementsRestService(vm.labbook.pk);
        };

        /**
         * save the searchString for filtering
         * @param searchString
         */
        vm.doSearch = function (searchString) {
            vm.searchField = searchString;
        };

        vm.cancelSearch = function () {
            vm.searchField = "";
            console.log("cancel search");
        };

        /**
         * Activates the specified view and sets a individual placeholder
         * when a selection in a plugins' dropdown-menu has been made
         * @param type {string}
         * @param plugin {object}
         */
        vm.switchPluginView = function (type, plugin) {
            vm.previousPluginModalPage = vm.currentPluginModalPage;
            if (vm.currentPluginModalPage == 'step1') {
                vm.backToPreviousPageString = gettextCatalog.getString("Back to overview");
            } else {
                vm.backToPreviousPageString = gettextCatalog.getString("Back to ") + vm.currentlyViewedPlugin.title;
            }
            vm.currentPluginModalPage = type;
            vm.currentlyViewedPlugin = plugin;
            if (type === 'request_access') {
                vm.feedback.placeholder =
                    gettextCatalog.getString("Request to access plugin ") + vm.currentlyViewedPlugin.title;
            } else if (type === 'feedback') {
                vm.feedback.placeholder =
                    gettextCatalog.getString("Feedback for plugin ") + vm.currentlyViewedPlugin.title;
            }
        }

        /**
         * Get all available plugins from backend
        */
        vm.getPlugins = function () {
            PluginRestService.query(vm.filters).$promise.then(
                function success (response) {
                    // store plugins
                    vm.plugins = response;
                },
                function error (rejection) {
                    console.log(rejection);
                    toaster.pop('error', gettextCatalog.getString("Error"),
                        gettextCatalog.getString("Failed to query Plugins"));
                }
            );
        }

        vm.sendMail = function (feedbackType) {

            if (vm.feedback.subject === undefined) {
                vm.feedback.subject = vm.feedback.placeholder;
            }

            var data = {
                subject: vm.feedback.subject,
                message: vm.feedback.message,
                pluginPk: vm.currentlyViewedPlugin.pk,
                type: feedbackType
            };

            PluginRestService.resource.feedback(data).$promise.then(
                function success (response) {
                    console.log("Feedback sent");
                    toaster.pop('success', gettextCatalog.getString("Feedback sent"));
                    vm.dismiss();
                },
                function error (rejection) {
                    console.log("Failed to send feedback");
                    console.log(rejection);
                    if (rejection.data) {
                        vm.errors = rejection.data;
                    } else {
                        toaster.pop('error', gettextCatalog.getString("Failed to send feedback"));
                    }
                }
            )
        }

        /**
         * Execute getPlugins after the next digest cycle (Waits until all variables are initialized)
         */
        $timeout(function () {
            if (vm.detailOnly === false) {
                vm.getPlugins();
            }
        });

        $scope.$watch("vm.searchField", function () {
            if (vm.searchField !== undefined && (vm.searchField.length >= 3 || vm.searchField.length === 0)) {
                vm.filters['search'] = vm.searchField.toLowerCase();
                vm.filters['onlyPluginsWithAccess'] = vm.onlyPluginsWithAccess;
                vm.getPlugins();
            }
        }, true);

        $scope.$watch("vm.onlyPluginsWithAccess", function (newValue, oldValue) {
            if (newValue !== oldValue) {
                vm.filters['onlyPluginsWithAccess'] = vm.onlyPluginsWithAccess;
                vm.getPlugins();
            }
        }, true);

        /**
         * Selected plugin is saved to vm.selectedPlugin
         * @param plugin
         */
        vm.selectPlugin = function (plugin) {
            vm.selectedPlugin = plugin;
            vm.selectionHasBeenMade = true;
        }

        vm.pluginIsSelected = function () {
            return Object.keys(vm.selectedPlugin).length <= 0;
        }

        /**
         * Handles the input from the user
         * checks if the user selected a section and queries for the sections childElements
         */
        vm.insertPlugininstance = function () {
            var filters = {};

            if (vm.parent === 'labbook') {
                vm.close(null);
            } else {
                // we are adding a filter here: ?section=<section.pk>
                if (vm.parent && vm.parent.pk) {
                    filters['section'] =  vm.parent.child_object_id;
                }
                vm.labbookChildElementRestService.query(filters).$promise.then(
                    function success (response) {
                        vm.parent.childElements = response;
                        vm.close(vm.parent);
                    }
                )
            }
        };

        /**
         * Closes the modal dialog and returns the selected location of the new element
         */
        vm.close = function (section) {
            $uibModalInstance.close({
                location: vm.location,
                section: section,
                selectedPluginPk: vm.selectedPlugin.pk
            });
        };

        vm.dismiss = function () {
            $uibModalInstance.dismiss();
        }
    });
})();
