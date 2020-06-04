(function () {
    "use strict";

    var module = angular.module('services');

    module.service('ResourceBookingRulesService', function (
        gettextCatalog
    ) {
        "ngInject";

        var service = {};

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

        service.getBookingRules = function () {
            return {
                'booking_rule_minimum_duration': gettextCatalog.getString('Minimum duration of a resource booking'),
                'booking_rule_maximum_duration': gettextCatalog.getString('Maximum duration of a resource booking'),
                'booking_rule_bookable_hours': gettextCatalog.getString('Bookable hours'),
                'booking_rule_minimum_time_before': gettextCatalog.getString('Minimum time before a resource booking'),
                'booking_rule_maximum_time_before': gettextCatalog.getString('Maximum time before a resource booking'),
                'booking_rule_time_between': gettextCatalog.getString('Minimum time between resource bookings'),
                'booking_rule_bookings_per_user': gettextCatalog.getString('Bookings per user')
            };
        };

        /**
         * Initializes the configuration setup
         */
        service.initializeBookingRulesConfiguration = function (resource) {
            var defaultBookingRules = [];

            // get default configuration for minimum duration
            if ('booking_rule_minimum_duration' in resource && resource.booking_rule_minimum_duration !== null) {
                service.storeBookingRule(defaultBookingRules, {
                    'id': resource.booking_rule_minimum_duration.id,
                    'criterion': 'booking_rule_minimum_duration',
                    'days': getDays(resource.booking_rule_minimum_duration.duration),
                    'hours': getHours(resource.booking_rule_minimum_duration.duration),
                    'minutes': getMinutes(resource.booking_rule_minimum_duration.duration)
                });
            }

            // get default configuration for maximum duration
            if ('booking_rule_maximum_duration' in resource && resource.booking_rule_maximum_duration !== null) {
                service.storeBookingRule(defaultBookingRules, {
                    'id': resource.booking_rule_maximum_duration.id,
                    'criterion': 'booking_rule_maximum_duration',
                    'days': getDays(resource.booking_rule_maximum_duration.duration),
                    'hours': getHours(resource.booking_rule_maximum_duration.duration),
                    'minutes': getMinutes(resource.booking_rule_maximum_duration.duration)
                });
            }

            // get default configuration for bookable hours
            if ('booking_rule_bookable_hours' in resource && resource.booking_rule_bookable_hours !== null) {
                service.storeBookingRule(defaultBookingRules, {
                    'id': resource.booking_rule_bookable_hours.id,
                    'criterion': 'booking_rule_bookable_hours',
                    'monday': resource.booking_rule_bookable_hours.monday,
                    'tuesday': resource.booking_rule_bookable_hours.tuesday,
                    'wednesday': resource.booking_rule_bookable_hours.wednesday,
                    'thursday': resource.booking_rule_bookable_hours.thursday,
                    'friday': resource.booking_rule_bookable_hours.friday,
                    'saturday': resource.booking_rule_bookable_hours.saturday,
                    'sunday': resource.booking_rule_bookable_hours.sunday,
                    'time_start': resource.booking_rule_bookable_hours.time_start,
                    'time_end': resource.booking_rule_bookable_hours.time_end
                });
            }

            // get default configuration for minimum time before booking
            if ('booking_rule_minimum_time_before' in resource && resource.booking_rule_minimum_time_before !== null) {
                service.storeBookingRule(defaultBookingRules, {
                    'id': resource.booking_rule_minimum_time_before.id,
                    'criterion': 'booking_rule_minimum_time_before',
                    'days': getDays(resource.booking_rule_minimum_time_before.duration),
                    'hours': getHours(resource.booking_rule_minimum_time_before.duration),
                    'minutes': getMinutes(resource.booking_rule_minimum_time_before.duration)
                });
            }

            // get default configuration for maximum time before booking
            if ('booking_rule_maximum_time_before' in resource && resource.booking_rule_maximum_time_before !== null) {
                service.storeBookingRule(defaultBookingRules, {
                    'id': resource.booking_rule_maximum_time_before.id,
                    'criterion': 'booking_rule_maximum_time_before',
                    'days': getDays(resource.booking_rule_maximum_time_before.duration),
                    'hours': getHours(resource.booking_rule_maximum_time_before.duration),
                    'minutes': getMinutes(resource.booking_rule_maximum_time_before.duration)
                });
            }

            // get default configuration for minimum time between bookings
            if ('booking_rule_time_between' in resource && resource.booking_rule_time_between !== null) {
                service.storeBookingRule(defaultBookingRules, {
                    'id': resource.booking_rule_time_between.id,
                    'criterion': 'booking_rule_time_between',
                    'days': getDays(resource.booking_rule_time_between.duration),
                    'hours': getHours(resource.booking_rule_time_between.duration),
                    'minutes': getMinutes(resource.booking_rule_time_between.duration)
                });
            }

            // get default configuration for bookings per user
            if ('booking_rule_bookings_per_user' in resource && resource.booking_rule_bookings_per_user.length) {
                angular.forEach(resource.booking_rule_bookings_per_user, function (element) {
                    service.storeBookingRule(defaultBookingRules, {
                        'id': element.id,
                        'criterion': 'booking_rule_bookings_per_user',
                        'value': element.count,
                        'unit': element.unit
                    });
                });
            }

            return defaultBookingRules;
        };

        /**
         * Takes a few arguments and returns the complete booking rule object
         */
        service.getBookingRuleObject = function (bookingRules) {
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
        service.storeBookingRule = function (configurationObject, configuration) {
            var bookingRuleObject = service.getBookingRuleObject(configuration);

            configurationObject.push(bookingRuleObject);
        };

        return service;
    });
})();
