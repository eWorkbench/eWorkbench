/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        module = angular.module('screens');

    module.component('studyRoomView', {
        templateUrl: 'js/screens/studyRoom/studyRoomView.html',
        controller: 'StudyRoomViewController',
        controllerAs: 'vm',
        bindings: {
            'resource': '<',
            'readOnly': '<'
        }
    });

    module.controller('StudyRoomViewController', function (
        $rootScope,
        $scope,
        $q,
        gettextCatalog,
        AuthRestService,
        ResourceRestService,
        ResourceConverterService,
        toaster,
        selectFileWithPicker,
        IconImagesService,
        confirmDialogWidget,
        PermissionService,
        $filter,
        ResourceBookingRulesService,
        $timeout,
        $state,
        FilterUrlStateService
    ) {
        'ngInject';

        var vm = this;

        this.$onInit = function () {
            vm.resourceIcon = IconImagesService.mainElementIcons.resource;
            vm.view = 'view';
            vm.currentUser = AuthRestService.getCurrentUser();
            vm.branchLibraries = ResourceConverterService.branchLibraryTexts;
            vm.loadedResources = [];
            vm.resourcesLoaded = false;

            /**
             * calendar configuration of the angular ui calendar
             */
            vm.calendarConfig = {
                header: {
                    left: 'title',
                    center: 'month agendaWeek today prev next',
                    right: 'bookroom'
                },
                allDaySlot: false,
                longPressDelay: 100
            };

            /**
             * Collapse the metadata area by default
             * @type {boolean}
             */
            vm.metaDataCollapsed = true;

            vm.showMyResourceBookings = true;
            vm.selectedProjects = [];
            vm.users = [];

            /**
             * The options for booking rules
             * @type {{}}
             */
            vm.bookingRules = ResourceBookingRulesService.getBookingRules();

            $timeout(function () {
                $rootScope.$broadcast("change-navbar", {study_room_mode: true});
                // vm.decodeParams();
            });
        };

        this.$onDestroy = function () {
            $rootScope.$broadcast("change-navbar", {study_room_mode: false});
        };

        vm.encodeParams = function () {
            if (vm.selectedBranchLibrary) {
                FilterUrlStateService.setFilterOption('branch_library', vm.selectedBranchLibrary);
            }

            if (vm.resourcePk) {
                FilterUrlStateService.setFilterOption('resource', vm.resourcePk);
            }
        };

        vm.decodeParams = function () {
            if (!$state.params) {
                return;
            }

            if ($state.params['branch_library']) {
                vm.selectedBranchLibrary = $state.params['branch_library'];
            } else {
                return;
            }

            if ($state.params['resource']) {
                // wait until resources have been loaded
                var disableWatcher = $scope.$watch('vm.resourcesLoaded', function (newVal, oldVal) {
                    if (newVal) {
                        vm.resourcePk = $state.params['resource'];
                        disableWatcher();
                    }
                });
            }
        };

        vm.loadResources = function () {
            ResourceRestService.query({
                'study_room': 'True',
                'branch_library': vm.selectedBranchLibrary,
                'bookable_by_students': true
            }).$promise.then(
                function success (response) {
                    vm.loadedResources.length = 0;
                    for (var t = 0; t < response.length; t++) {
                        vm.loadedResources.push(response[t]);
                    }
                },
                function error (rejection) {
                    console.error("Could not load resources ", rejection);
                    toaster.pop('error', gettextCatalog.getString("Could not load resources"));
                }
            ).finally(function () {
                vm.resourcesLoaded = true;
            });
        };

        // watch for changes in vm.selectedBranchLibrary and query resources for selected branch library
        $scope.$watch('vm.selectedBranchLibrary', function () {
            vm.resourcePk = null;
            vm.resource = null;
            vm.resourcesLoaded = false;
            // vm.encodeParams();
            if (vm.selectedBranchLibrary) {
                vm.loadResources();
            }
        });

        // watch for changes in vm.resourcePk and get the resource object from vm.loadedResources
        $scope.$watch('vm.resourcePk', function () {
            vm.resource = null;
            // vm.encodeParams();
            if (vm.resourcePk) {
                $timeout(function () {
                    vm.resource = $filter('filter')(vm.loadedResources, {'pk': vm.resourcePk})[0];
                    vm.defaultBookingRules =
                        ResourceBookingRulesService.initializeBookingRulesConfiguration(vm.resource);
                });
            }
        });

        /**
         * Toggles visibility of meta data
         * Default setting (closed or open) is determined in `this.$onInit = function () {  init();  };`
         */
        vm.toggleMetaDataVisibility = function () {
            vm.metaDataCollapsed = !vm.metaDataCollapsed;
        };

        /**
         * Button for uploading a new file
         */
        vm.uploadNewFile = function () {
            selectFileWithPicker().then(
                function fileSelected (file) {
                    vm.saveResource(file);
                }
            );
        };

        /**
         * Toggles visibility of meta data
         * Default setting (closed or open) is determined in `this.$onInit = function () {  init();  };`
         */
        vm.toggleMetaDataVisibility = function () {
            vm.metaDataCollapsed = !vm.metaDataCollapsed;
        };

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.resource);
        };

        /**
         * Button for deleting the terms of use pdf
         */
        vm.deleteFile = function () {
            var modalInstance = confirmDialogWidget.open({
                title: gettextCatalog.getString('Delete?'),
                message: gettextCatalog.getString('Do you really want to delete this terms of use PDF'),
                cancelButtonText: gettextCatalog.getString('Cancel'),
                okButtonText: gettextCatalog.getString('Delete'),
                dialogKey: 'DeleteTermsOfUsePdf'
            });

            modalInstance.result.then(
                function confirm (doDelete) {
                    if (doDelete) {
                        vm.saveResource(null).then(
                            function success (response) {
                                toaster.pop('success', gettextCatalog.getString("Deleted"));
                            },
                            function error (rejection) {
                                console.log(rejection);
                                if (rejection.data && rejection.data.non_field_errors) {
                                    toaster.pop('error', gettextCatalog.getString("Delete failed"),
                                        rejection.data.non_field_errors.join(" ")
                                    );
                                } else {
                                    toaster.pop('error', gettextCatalog.getString("Delete failed"));
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
         * Resets the booking rules settings
         */
        vm.resetBookingRulesOnResourceObject = function () {
            vm.resource.booking_rule_minimum_duration = null;
            vm.resource.booking_rule_maximum_duration = null;
            vm.resource.booking_rule_bookable_hours = null;
            vm.resource.booking_rule_minimum_time_before = null;
            vm.resource.booking_rule_maximum_time_before = null;
            vm.resource.booking_rule_time_between = null;
            vm.resource.booking_rule_bookings_per_user = [];
        };

        /**
         * Updates the booking rules settings
         * @param rules
         */
        vm.updateBookingRulesOnResourceObject = function (rules) {
            angular.forEach(rules, function (rule) {
                switch (rule.criterion) {
                    case 'booking_rule_minimum_duration':
                        vm.resource.booking_rule_minimum_duration = {
                            'id': rule.id || null,
                            'duration': rule.value + ':00'
                        };
                        break;
                    case 'booking_rule_maximum_duration':
                        vm.resource.booking_rule_maximum_duration = {
                            'id': rule.id || null,
                            'duration': rule.value + ':00'
                        };
                        break;
                    case 'booking_rule_bookable_hours':
                        vm.resource.booking_rule_bookable_hours = {
                            'id': rule.id || null,
                            'monday': rule.monday,
                            'tuesday': rule.tuesday,
                            'wednesday': rule.wednesday,
                            'thursday': rule.thursday,
                            'friday': rule.friday,
                            'saturday': rule.saturday,
                            'sunday': rule.sunday,
                            'time_start': rule.time_start + ':00',
                            'time_end': rule.time_end + ':00'
                        };
                        break;
                    case 'booking_rule_minimum_time_before':
                        vm.resource.booking_rule_minimum_time_before = {
                            'id': rule.id || null,
                            'duration': rule.value + ':00'
                        };
                        break;
                    case 'booking_rule_maximum_time_before':
                        vm.resource.booking_rule_maximum_time_before = {
                            'id': rule.id || null,
                            'duration': rule.value + ':00'
                        };
                        break;
                    case 'booking_rule_time_between':
                        vm.resource.booking_rule_time_between = {
                            'id': rule.id || null,
                            'duration': rule.value + ':00'
                        };
                        break;
                    case 'booking_rule_bookings_per_user':
                        vm.resource.booking_rule_bookings_per_user.push({
                            'id': rule.id || null,
                            'count': rule.value,
                            'unit': rule.unit
                        });
                        break;
                    default:
                        console.log('Unknown criterion for rule: ' + rule.criterion);
                        break;
                }
            });
        };
    });
})();
