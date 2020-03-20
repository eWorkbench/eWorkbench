/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * Displays a paginated list of versions
     */
    module.directive('versionsShortWidget', function () {
        return {
            restrict: 'E',
            templateUrl: 'js/widgets/versions/versionsShortWidget.html',
            controller: 'VersionShortWidgetController',
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                baseUrlModel: '@',
                baseModel: '=',
                expanded: '=?',
                readonly: '=?',
                versionsPerPage: '=?',
                versionInProgressAlwaysVisible: '@'
            }
        }
    });

    module.controller('VersionShortWidgetController', function (
        $scope,
        $injector,
        $cookies,
        gettextCatalog,
        toaster,
        WorkbenchElementsTranslationsService,
        VersionRestServiceFactory,
        VersionCreateModalService,
        VersionRestoreModalService,
        PermissionService,
        NavigationService
    ) {
        'ngInject';
        var vm = this;

        this.$onInit = function () {
            vm._versionsPerPage = 10;
            vm.initialVersionNumberOfBaseModel = vm.baseModel.version_number;

            /**
             * The list of versions
             * @type {Array}
             */
            vm.versions = [];

            /**
             * Whether or not there are more entries available
             * @type {boolean}
             */
            vm.showMoreEntries = false;

            /**
             * Stores the number of entries
             * @type {number}
             */
            vm.numberOfVersions = 0;

            /**
             * Number of the version in progress or null, if no changes made since the last version.
             */
            vm.versionInProgress = null;

            /**
             * Whether or not the versions have been loaded yet
             * @type {boolean}
             */
            vm.versionsLoaded = false;

            /**
             * ViewMode - 'limited' shows only some entries, while 'all' shows a pagination
             * @type {string}
             */
            vm.viewMode = 'limited';

            /**
             * Stores the pagination limit that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentLimit = vm._versionsPerPage;

            /**
             * Stores the pagination offset that is currently active (if viewMode == 'all')
             * @type {number}
             */
            vm.currentOffset = 0;

            /**
             * The current pagination page
             * @type {number}
             */
            vm.currentPage = 1;

            /**
             * Used to force non-bold text for the first version on the page,
             * if we are not on the first page.
             * @type {string}
             */
            vm.versionStyle = {};

            vm.modelNameToTranslation = WorkbenchElementsTranslationsService.modelNameToTranslation;

            if (vm.versionsPerPage) {
                vm._versionsPerPage = vm.versionsPerPage
            }

            /**
             * Ask the user if he wants to create a version, after every 8th change
             */
            $scope.$watch("vm.baseModel.version_number", function () {
                if (!$cookies.get('DoNotAskForVersion')) {
                    var changeCount = vm.baseModel.version_number - vm.initialVersionNumberOfBaseModel;

                    if (changeCount > 0 && changeCount % 8 === 0) {
                        vm.showNewVersionDialog(true);
                    }
                }
            });

            vm.versionService = VersionRestServiceFactory(vm.baseUrlModel, vm.baseModel.pk);

            if (vm.expanded) {
                vm.showMoreEntries = true;
                vm.viewMode = 'all';
            }

            $scope.$watch('vm.baseModel.version_number', function () {
                vm.reloadVersions();
            }, true);
        };

        vm.reloadVersions = function () {
            if (vm.viewMode === 'all') {
                vm.loadVersions(vm.currentLimit, vm.currentOffset);
            } else {
                vm.loadVersions();
            }
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readonly || vm.baseModel.deleted || !PermissionService.has('object.edit', vm.baseModel);
        };

        /**
         * Returns the translated field
         */
        vm.getTranslatedFieldName = function (field) {
            return WorkbenchElementsTranslationsService.translateFieldName(vm.baseUrlModel, field)
        };

        /**
         * Loads the versions for this element
         */
        vm.loadVersions = function (limit, offset) {
            if (limit === undefined) {
                limit = 5;
            }
            if (offset === undefined) {
                offset = 0;
            }

            return vm.versionService.query({limit: limit, offset: offset}).$promise.then(
                function success (response) {
                    if (response.count) {
                        vm.numberOfVersions = response.count;
                        if (response.count > 5) {
                            vm.showMoreEntries = (response.count > 5);
                        } else {
                            vm.showMoreEntries = false;
                        }
                    }
                    vm.versions = response.results;
                    vm.versionsLoaded = true;
                    vm.updateVersionInProgress();
                },
                function error (rejection) {
                    toaster.pop('error', gettextCatalog.getString("Failed to load versions"));
                    console.log(rejection);
                }
            );
        };

        /**
         * Checks if there is a saved version.
         */
        vm.hasVersion = function () {
            return vm.versions.length > 0;
        };

        vm.isLastVersionModified = function () {
            var isModified = false;

            if (vm.hasVersion()) {
                var versionTimestamp = moment(vm.getLastVersion().created_at),
                    modelTimestamp = moment(vm.baseModel.last_modified_at);

                isModified = versionTimestamp < modelTimestamp;
            }

            return isModified;
        };

        /**
         * Checks if there is a version in progress and updates the view model.
         */
        vm.updateVersionInProgress = function () {
            var versionInProgressOnCurrentPage = vm.viewMode === 'limited' || vm.currentPage === 1;

            if (versionInProgressOnCurrentPage
                && (!vm.hasVersion() || vm.isLastVersionModified() || vm.versionInProgressAlwaysVisible)) {
                vm.versionInProgress = vm.getNextVersionNumber();
            } else {
                vm.versionInProgress = null;
            }
        };

        vm.isFinalizeButtonVisible = function () {
            return !vm.isReadOnly() && (vm.versionInProgressAlwaysVisible || vm.versionInProgress != null);
        };

        vm.getLastVersion = function () {
            return vm.hasVersion() ? vm.versions[0] : null;
        };

        vm.getNextVersionNumber = function () {
            return vm.numberOfVersions + 1;
        };

        /**
         * Toggles view mode - show more
         */
        vm.showMoreVersions = function () {
            vm.viewMode = 'all';
            vm.pageChanged();
        };

        /**
         * Toggles view mode - show less
         */
        vm.showLessVersions = function () {
            vm.viewMode = 'limited';
            vm.loadVersions();
        };

        /**
         * Event when page has changed
         */
        vm.pageChanged = function () {
            vm.currentOffset = (vm.currentPage - 1) * vm._versionsPerPage;
            vm.currentLimit = vm._versionsPerPage;
            vm.loadVersions(vm.currentLimit, vm.currentOffset);

            // force non-bold text in all version cells, when we are not on the first page
            // required, because the first version cell is made bold by CSS to mark the current version
            if (vm.currentPage > 1) {
                vm.versionStyle = {'font-weight': 'normal'};
            } else {
                vm.versionStyle = {};
            }
        };

        vm.showNewVersionDialog = function (isAutoPrompt) {
            var model = vm.baseUrlModel,
                pk = vm.baseModel.pk,
                modal = isAutoPrompt
                    ? VersionCreateModalService.openAutoPrompt(model, pk, vm.getNextVersionNumber())
                    : VersionCreateModalService.open(model, pk, vm.getNextVersionNumber());

            modal.result.then(
                function created (version) {
                    vm.loadVersions();
                },
                function dismissed () {
                    // nothing to do
                }
            );
        };

        vm.showRestoreDialog = function (version) {
            var modal = VersionRestoreModalService.open(
                vm.baseModel, vm.baseUrlModel, version,
                vm.isReadOnly(),
                vm.isLastVersionModified()
            );

            modal.result.then(
                function restored (version) {
                    NavigationService.reloadModelView(vm.baseModel);
                },
                function dismissed () {
                    // nothing to do
                }
            );
        };
    });
})();
