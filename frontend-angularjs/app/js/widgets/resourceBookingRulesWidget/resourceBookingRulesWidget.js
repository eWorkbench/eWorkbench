/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var module = angular.module('widgets');

    /**
     * A directive to display durations without seconds
     * */
    module.directive('noSeconds', function () {
        return {
            require: 'ngModel',
            link: function (elem, $scope, attrs, ngModel) {
                ngModel.$formatters.push(function (val) {
                    if (val) {
                        return val.split(":").slice(0,-1).join(':');
                    }

                    return null;
                });
                ngModel.$parsers.push(function (val) {
                    return val;
                });
            }
        }
    });

    /**
     * A widget for resource booking rules
     */
    module.directive('resourceBookingRulesWidget', function () {
        return {
            'restrict': 'E',
            'controller': 'ResourceBookingRulesWidgetController',
            'templateUrl': 'js/widgets/resourceBookingRulesWidget/resourceBookingRulesWidget.html',
            'bindToController': true,
            'controllerAs': 'vm',
            'scope': {
                'resource': '=',
                'title': '@'
            }
        };
    });

    module.controller('ResourceBookingRulesWidgetController', function (
        $scope,
        $q,
        gettextCatalog,
        IconImagesService,
        PermissionService
    ) {
        'ngInject';

        var vm = this;

        /**
         * The regex rule for time values
         */
        vm.regexPatternForTimes = /^(\d+ )?\d{1,2}:\d{2}$/;

        /**
         * The regex rule for days values
         * 0-999
         * @type {RegExp}
         */
        vm.regexPatternForDays = /^\d{1,3}$/;

        /**
         * The regex rule for hours values
         * 0-23
         * @type {RegExp}
         */
        vm.regexPatternForHours = /^(2[0-3]|1[0-9]|0?[0-9])$/;

        /**
         * The regex rule for minutes values
         * @type {RegExp}
         */
        vm.regexPatternForMinutes = /^([0-5]?[0-9]|[1-9])$/;

        /**
         * The regex rule for time values without seconds
         */
        vm.regexPatternForTimesWithoutSeconds = /^(\d+ )?\d{1,2}:\d{2}$/;

        /**
         * The options for booking rules
         * @type {{}}
         */
        vm.bookingRules = {
            'booking_rule_minimum_duration': gettextCatalog.getString('Minimum duration of a resource booking'),
            'booking_rule_maximum_duration': gettextCatalog.getString('Maximum duration of a resource booking'),
            'booking_rule_bookable_hours': gettextCatalog.getString('Bookable hours'),
            'booking_rule_minimum_time_before': gettextCatalog.getString('Minimum time before a resource booking'),
            'booking_rule_maximum_time_before': gettextCatalog.getString('Maximum time before a resource booking'),
            'booking_rule_time_between': gettextCatalog.getString('Minimum time between resource bookings'),
            'booking_rule_bookings_per_user': gettextCatalog.getString('Bookings per user')
        };

        /**
         * The options for bookings per user
         * @type {{}}
         */
        vm.bookingsPerUserOptions = {
            'DAY': gettextCatalog.getString('Day'),
            'WEEK': gettextCatalog.getString('Week'),
            'MONTH': gettextCatalog.getString('Month')
        };

        /**
         * The currently selected booking rule to add
         * @type string
         */
        vm.currentlySelectedBookingRule = 'booking_rule_minimum_duration';

        /**
         * All selected booking rules
         * @type []
         */
        vm.selectedBookingRules = [];

        /**
         * Default configuration for booking rules
         * @type []
         */
        vm.defaultBookingRules = [];

        /**
         * Form reference for configuring booking rules
         * @type ngForm
         */
        vm.selectedBookingRulesForm = null;

        /**
         * Holds the validation for the check if duplicate units are present in the form to avoid unnecessary API calls
         * @type boolean
         */
        vm.duplicateUnitsOnBookingsPerUser = false;

        /**
         * gets the correct icons
         */
        vm.alertIcon = IconImagesService.mainWarningIcons.alert;

        /**
         * Initialize widget
         */
        this.$onInit = function () {
            vm.initializeBookingRulesConfiguration();
        };

        /**
         * Watcher for changes on resource object
         */
        $scope.$watch('vm.resource', function () {
            vm.initializeBookingRulesConfiguration();
        });

        /**
         * Indicates whether the user should be allowed to edit the model instance or not
         * @type {boolean}
         */
        vm.isReadOnly = function () {
            return vm.readOnly || vm.isLocked || !PermissionService.has('object.edit', vm.resource);
        };

        /**
         * Returns the days of given duration
         */
        function getDays (duration) {
            if (duration.split(" ")[0].split(":")[1]) {
                return '0';
            }

            return duration.split(" ")[0];
        }

        /**
         * Returns the hours of given duration
         */
        function getHours (duration) {
            if (!duration.split(" ")[1]) {
                return duration.split(":")[0];
            }

            return duration.split(" ")[1].split(":")[0];
        }

        /**
         * Returns the minutes of given duration
         */
        function getMinutes (duration) {
            if (!duration.split(" ")[1]) {
                return duration.split(":")[1];
            }

            return duration.split(" ")[1].split(":")[1];
        }

        /**
         * Initializes the configuration setup
         */
        vm.initializeBookingRulesConfiguration = function () {
            // reset existing configuration first
            vm.defaultBookingRules = [];
            vm.selectedBookingRules = [];

            // get default configuration for minimum duration
            if ('booking_rule_minimum_duration' in vm.resource && vm.resource.booking_rule_minimum_duration !== null) {
                vm.storeBookingRule(vm.defaultBookingRules, {
                    'id': vm.resource.booking_rule_minimum_duration.id,
                    'criterion': 'booking_rule_minimum_duration',
                    'days': getDays(vm.resource.booking_rule_minimum_duration.duration),
                    'hours': getHours(vm.resource.booking_rule_minimum_duration.duration),
                    'minutes': getMinutes(vm.resource.booking_rule_minimum_duration.duration)
                });
            }

            // get default configuration for maximum duration
            if ('booking_rule_maximum_duration' in vm.resource && vm.resource.booking_rule_maximum_duration !== null) {
                vm.storeBookingRule(vm.defaultBookingRules, {
                    'id': vm.resource.booking_rule_maximum_duration.id,
                    'criterion': 'booking_rule_maximum_duration',
                    'days': getDays(vm.resource.booking_rule_maximum_duration.duration),
                    'hours': getHours(vm.resource.booking_rule_maximum_duration.duration),
                    'minutes': getMinutes(vm.resource.booking_rule_maximum_duration.duration)
                });
            }

            // get default configuration for bookable hours
            if ('booking_rule_bookable_hours' in vm.resource && vm.resource.booking_rule_bookable_hours !== null) {
                vm.storeBookingRule(vm.defaultBookingRules, {
                    'id': vm.resource.booking_rule_bookable_hours.id,
                    'criterion': 'booking_rule_bookable_hours',
                    'monday': vm.resource.booking_rule_bookable_hours.monday,
                    'tuesday': vm.resource.booking_rule_bookable_hours.tuesday,
                    'wednesday': vm.resource.booking_rule_bookable_hours.wednesday,
                    'thursday': vm.resource.booking_rule_bookable_hours.thursday,
                    'friday': vm.resource.booking_rule_bookable_hours.friday,
                    'saturday': vm.resource.booking_rule_bookable_hours.saturday,
                    'sunday': vm.resource.booking_rule_bookable_hours.sunday,
                    'time_start': vm.resource.booking_rule_bookable_hours.time_start,
                    'time_end': vm.resource.booking_rule_bookable_hours.time_end
                });
            }

            // get default configuration for minimum time before booking
            if ('booking_rule_minimum_time_before' in vm.resource && vm.resource.booking_rule_minimum_time_before !== null) {
                vm.storeBookingRule(vm.defaultBookingRules, {
                    'id': vm.resource.booking_rule_minimum_time_before.id,
                    'criterion': 'booking_rule_minimum_time_before',
                    'days': getDays(vm.resource.booking_rule_minimum_time_before.duration),
                    'hours': getHours(vm.resource.booking_rule_minimum_time_before.duration),
                    'minutes': getMinutes(vm.resource.booking_rule_minimum_time_before.duration)
                });
            }

            // get default configuration for maximum time before booking
            if ('booking_rule_maximum_time_before' in vm.resource && vm.resource.booking_rule_maximum_time_before !== null) {
                vm.storeBookingRule(vm.defaultBookingRules, {
                    'id': vm.resource.booking_rule_maximum_time_before.id,
                    'criterion': 'booking_rule_maximum_time_before',
                    'days': getDays(vm.resource.booking_rule_maximum_time_before.duration),
                    'hours': getHours(vm.resource.booking_rule_maximum_time_before.duration),
                    'minutes': getMinutes(vm.resource.booking_rule_maximum_time_before.duration)
                });
            }

            // get default configuration for minimum time between bookings
            if ('booking_rule_time_between' in vm.resource && vm.resource.booking_rule_time_between !== null) {
                vm.storeBookingRule(vm.defaultBookingRules, {
                    'id': vm.resource.booking_rule_time_between.id,
                    'criterion': 'booking_rule_time_between',
                    'days': getDays(vm.resource.booking_rule_time_between.duration),
                    'hours': getHours(vm.resource.booking_rule_time_between.duration),
                    'minutes': getMinutes(vm.resource.booking_rule_time_between.duration)
                });
            }

            // get default configuration for bookings per user
            if ('booking_rule_bookings_per_user' in vm.resource && vm.resource.booking_rule_bookings_per_user.length) {
                angular.forEach(vm.resource.booking_rule_bookings_per_user, function (element) {
                    vm.storeBookingRule(vm.defaultBookingRules, {
                        'id': element.id,
                        'criterion': 'booking_rule_bookings_per_user',
                        'value': element.count,
                        'unit': element.unit
                    });
                });
            }

            // set the selected booking rules to the default value from the resource configuration
            angular.copy(vm.defaultBookingRules, vm.selectedBookingRules);
        };

        /**
         * Takes a few arguments and returns the complete booking rule object
         */
        vm.getBookingRuleObject = function (bookingRules) {
            return {
                'id': bookingRules.id || null,
                'resource': bookingRules.resource || null,
                'criterion': bookingRules.criterion || null,
                'value': bookingRules.value || null,
                'days': bookingRules.days || null,
                'hours': bookingRules.hours || null,
                'minutes': bookingRules.minutes || null,
                'unit': bookingRules.unit || null,
                'monday': bookingRules.monday || false,
                'tuesday': bookingRules.tuesday || false,
                'wednesday': bookingRules.wednesday || false,
                'thursday': bookingRules.thursday || false,
                'friday': bookingRules.friday || false,
                'saturday': bookingRules.saturday || false,
                'sunday': bookingRules.sunday || false,
                'time_start': bookingRules.time_start || null,
                'time_end': bookingRules.time_end || null
            };
        };

        /**
         * Store a booking rule in the booking rules configuration
         * @param configurationObject
         * @param configuration {{}}
         */
        vm.storeBookingRule = function (configurationObject, configuration) {
            var bookingRuleObject = vm.getBookingRuleObject(configuration);

            configurationObject.push(bookingRuleObject);
        };

        /**
         * Adds a new booking rule with the currently selected criterion
         */
        vm.addCurrentlySelectedBookingRule = function () {
            /**
             * Check first if the criterion has already been added. There can only be one element of each
             * criterion except for 'booking_rule_bookings_per_user' which allows three configurations at once.
             */
            var bookingRuleAlreadySelected = vm.selectedBookingRules.filter(function (element) {
                return element.criterion === vm.currentlySelectedBookingRule;
            });

            var allowedCountForBookingRule = 1;

            if (vm.currentlySelectedBookingRule === 'booking_rule_bookings_per_user') {
                allowedCountForBookingRule = 3;
            }

            if (bookingRuleAlreadySelected.length < allowedCountForBookingRule) {
                vm.storeBookingRule(vm.selectedBookingRules, {
                    'criterion': vm.currentlySelectedBookingRule,
                    'days': '0'
                });
                vm.selectedBookingRulesForm.$setDirty();
            }
        };

        /**
         * Deletes the selected booking rule
         */
        vm.deleteSelectedBookingRule = function (selectedBookingRule) {
            if (!vm.selectedBookingRules.includes(selectedBookingRule)) {
                return;
            }

            var indexOfSelectedBookingRule = vm.selectedBookingRules.indexOf(selectedBookingRule);

            if (indexOfSelectedBookingRule !== -1) {
                vm.selectedBookingRules.splice(indexOfSelectedBookingRule, 1);
                vm.selectedBookingRulesForm.$setDirty();
                vm.checkForUnitDuplicatesOnBookingsPerUser();
            }
        };

        /**
         * Prepares all configured booking rules to save
         */
        vm.prepareBookingRules = function () {
            for (var i = 0; i < vm.selectedBookingRules.length; i++) {
                if ([
                    'booking_rule_minimum_duration',
                    'booking_rule_maximum_duration',
                    'booking_rule_minimum_time_before',
                    'booking_rule_maximum_time_before',
                    'booking_rule_time_between'
                ].includes(vm.selectedBookingRules[i].criterion)) {
                    vm.selectedBookingRules[i].value = vm.selectedBookingRules[i].days + " "
                        + vm.selectedBookingRules[i].hours + ":"
                        + vm.selectedBookingRules[i].minutes;
                }
            }
        }

        /**
         * Saves all configured booking rules
         */
        vm.saveBookingRules = function () {
            if (vm.checkForUnitDuplicatesOnBookingsPerUser() || vm.isReadOnly()) {
                return;
            }
            vm.prepareBookingRules();
            angular.copy(vm.selectedBookingRules, vm.defaultBookingRules);
            $scope.$emit('saveResourceBookingRules', vm.defaultBookingRules);
            vm.selectedBookingRulesForm.$setPristine();
        };

        /**
         * Saves all configured booking rules
         */
        vm.cancelBookingRulesChanges = function () {
            angular.copy(vm.defaultBookingRules, vm.selectedBookingRules);
            vm.selectedBookingRulesForm.$setPristine();
            vm.checkForUnitDuplicatesOnBookingsPerUser();
        };

        /**
         * Checks for unit duplicates in bookings per user configuration
         */
        vm.checkForUnitDuplicatesOnBookingsPerUser = function () {
            var unitValues = {};

            var duplicates = vm.selectedBookingRules.some(function (configuration) {
                if (configuration.criterion === 'booking_rule_bookings_per_user') {
                    return unitValues.hasOwnProperty(configuration.unit) || (unitValues[configuration.unit] = false);
                }

                return false;
            });

            vm.duplicateUnitsOnBookingsPerUser = duplicates;
            vm.selectedBookingRulesForm.$invalid = duplicates;

            return duplicates;
        };

        /**
         * Fill empty hours and minutes fields
         */
        $scope.$watch('vm.selectedBookingRules', function (newRules, oldRules) {
            for (var i = 0; i < newRules.length; i++) {
                var
                    newRule = newRules[i],
                    oldRule = oldRules[i];

                if (newRule.hours != null) {
                    if (newRule.minutes == null && oldRule.minutes == null) {
                        newRule.minutes = '00';
                    }
                } else if (newRule.minutes != null && oldRule.hours == null) {
                    newRule.hours = '00';
                }
            }
        }, true);
    });
})();
