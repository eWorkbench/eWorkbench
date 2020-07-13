(function () {
    'use strict';

    var
        module = angular.module('services');

    /**
     * Define API Endpoint for /api/contacts using ngResource
     */
    module.factory('CalendarAccessPrivilegeRestService',function (
        $resource,
        restApiUrl
    ) {
        'ngInject';

        // create ng-resource for api endpoint /api/calendar-access-privileges/
        // Don't cache here as users wouldn't find new calender privileges without emptying the cache first
        return $resource(
            restApiUrl + 'calendar-access-privileges/:pk/',
            {pk: '@pk'},
            {},
            {
                keyName: 'pk',
                cacheTimeoutInSeconds: 60, // seconds
                invalidateCacheOnUpdates: false,
                invalidateCacheOnInsert: true,
                relatedCaches: []
            });
    });
})();
